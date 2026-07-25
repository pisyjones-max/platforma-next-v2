import os
import json
import requests
from requests.adapters import HTTPAdapter
import hashlib
import pandas as pd
import concurrent.futures
import time
import random
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime

# --- НАСТРОЙКИ ---
BASE_URL = "https://mk4s.ru/"

# Корень репо передаётся через env (в Actions: $GITHUB_WORKSPACE)
REPO_ROOT = os.environ.get("REPO_ROOT", os.path.dirname(os.path.abspath(__file__)))

# Куда складывать результаты
IMAGES_SERVE_DIR = os.path.join(REPO_ROOT, "public", "images")
CATALOG_JSON_PATH = os.path.join(REPO_ROOT, "public", "catalog", "catalog.json")

# Публичный префикс в catalog.json (как читает image.ts)
IMAGES_PUBLIC_PREFIX = "images"

MAX_WORKERS_PRODUCTS = 15
MAX_WORKERS_IMAGES = 30

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept-Language": "ru-RU,ru;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Connection": "keep-alive",
}

session = requests.Session()
adapter = HTTPAdapter(pool_connections=50, pool_maxsize=100)
session.mount("http://", adapter)
session.mount("https://", adapter)
session.headers.update(HEADERS)

PRODUCT_EXECUTOR = concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS_PRODUCTS)
IMAGE_EXECUTOR = concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS_IMAGES)

# --- НАДЁЖНОСТЬ: retry + backoff + пауза между запросами ---
MAX_RETRIES = 4
BACKOFF_BASE_SECONDS = 1.5
REQUEST_DELAY_RANGE = (0.5, 1.5)  # секунды, случайная пауза между запросами

# Промежуточное сохранение прогресса — на случай обрыва скрипта
CHECKPOINT_EVERY_N_CATEGORIES = 5
PROGRESS_LOG_PATH = os.path.join(REPO_ROOT, "scripts", "parser_progress.log")


def log_progress(message):
    """Пишет прогресс и в консоль, и в отдельный лог-файл."""
    print(message)
    try:
        with open(PROGRESS_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(f"[{datetime.now().isoformat(timespec='seconds')}] {message}\n")
    except Exception:
        pass


def request_with_retry(url, timeout=15):
    """
    GET-запрос с retry и экспоненциальной задержкой (до MAX_RETRIES попыток),
    плюс случайная пауза между УСПЕШНЫМИ запросами, чтобы не получить бан по IP.
    Возвращает Response или None, если все попытки исчерпаны.
    """
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            r = session.get(url, timeout=timeout)
            if r.status_code == 200:
                time.sleep(random.uniform(*REQUEST_DELAY_RANGE))
                return r
            last_error = f"HTTP {r.status_code}"
        except requests.exceptions.RequestException as e:
            last_error = str(e)

        if attempt < MAX_RETRIES:
            delay = (BACKOFF_BASE_SECONDS ** attempt) + random.uniform(0, 0.5)
            log_progress(f"  ⚠️  Попытка {attempt}/{MAX_RETRIES} для {url} не удалась "
                         f"({last_error}), повтор через {delay:.1f}с")
            time.sleep(delay)

    log_progress(f"  ❌ Не удалось получить {url} после {MAX_RETRIES} попыток ({last_error})")
    return None


# ─────────────────────────────────────────────
# Вспомогательные функции
# ─────────────────────────────────────────────

def get_product_sku(product):
    features = product.get("features", {})
    for key in ["Артикул", "Артикул товара", "Код товара", "SKU"]:
        if key in features and features[key]:
            return str(features[key]).strip()
    return hashlib.md5(product["url"].encode("utf-8")).hexdigest()[:10].upper()


def clean_feature_name(name):
    return name.strip().lower().replace(" ", "_")


def extract_pack_quantity(features):
    for key, value in features.items():
        key_l = key.lower()
        if "упаков" in key_l or "м2" in key_l or "м²" in key_l:
            try:
                num = float(value.replace(",", ".").split()[0])
                if num > 0:
                    return num
            except:
                pass
    return 1


def download_product_images_threaded(image_urls, sku):
    """
    Скачивает картинки в public/images/<sku>/.
    Если файл уже есть — не перекачивает (инкрементальное обновление).
    Возвращает веб-пути вида images/<sku>/filename.jpg
    """
    unique_urls = []
    for u in image_urls:
        if u and u not in unique_urls:
            unique_urls.append(u)

    pub_dir = os.path.join(IMAGES_SERVE_DIR, sku)
    os.makedirs(pub_dir, exist_ok=True)

    futures = []
    local_paths = []
    web_paths = []

    for i, img_url in enumerate(unique_urls):
        prefix = "" if i == 0 else f"_{i}"
        ext = os.path.splitext(img_url.split("?")[0])[1] or ".jpg"
        filename = f"{sku}{prefix}{ext}"
        filepath = os.path.join(pub_dir, filename)
        web_path = f"{IMAGES_PUBLIC_PREFIX}/{sku}/{filename}"

        futures.append(IMAGE_EXECUTOR.submit(download_single_file, img_url, filepath))
        local_paths.append(filepath)
        web_paths.append(web_path)

    concurrent.futures.wait(futures)

    result = []
    for lp, wp in zip(local_paths, web_paths):
        if os.path.exists(lp) and os.path.getsize(lp) > 0:
            result.append(wp)
    return result


def download_single_file(url, path):
    # Уже скачан — пропускаем
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return True
    r = request_with_retry(url, timeout=10)
    if r is not None and r.status_code == 200:
        with open(path, "wb") as f:
            f.write(r.content)
        return True
    return False


# ─────────────────────────────────────────────
# Парсинг товара
# ─────────────────────────────────────────────

def parse_product_details(product_url):
    r = request_with_retry(product_url, timeout=15)
    if r is None:
        return []
    try:
        soup = BeautifulSoup(r.text, "html.parser")
    except Exception:
        return []

    description = ""
    desc_block = soup.select_one(".product-description, #tab-description, .tab-pane")
    if desc_block:
        description = desc_block.get_text(" ", strip=True)

    old_price = ""
    old_price_tag = soup.select_one(".old-price, .price-old")
    if old_price_tag:
        old_price = old_price_tag.get_text(strip=True).replace(" ", "")

    gallery_map = {}
    all_photos = []

    for slide in soup.select(".product-images__image[data-image_id]"):
        img_id = slide.get("data-image_id")
        link_tag = slide.select_one("a")
        if link_tag:
            img_link = link_tag.get("href")
            full_url = urljoin(BASE_URL, img_link)
            all_photos.append(full_url)
            if img_id:
                gallery_map[str(img_id)] = full_url

    features_raw = {}
    features_clean = {}

    for f in soup.select("div.product-feature"):
        name_tag = f.select_one("span.product-feature__name")
        value_tag = f.select_one("div.product-feature__value")
        if name_tag:
            original_name = name_tag.get_text(strip=True)
            clean_name = clean_feature_name(original_name)
            value = value_tag.get_text(strip=True) if value_tag else ""
            features_raw[original_name] = value
            features_clean[clean_name] = value

    product_base = {
        "title": soup.select_one("h1.title_h1").get_text(strip=True) if soup.select_one("h1.title_h1") else "",
        "features": features_raw,
        "features_clean": features_clean,
        "url": product_url,
    }

    base_sku = get_product_sku(product_base)
    base_title = product_base["title"]
    variants = []

    spec_div = soup.select_one("#specprice-sku-features-div")
    if spec_div:
        try:
            skus_data = json.loads(spec_div.get_text())
            color_selects = soup.select(".product-feature-select__color")
            color_values = [el.get("data-value") for el in color_selects if el.get("data-value")]
            slides = soup.select(".product-images__image[data-image_id]")

            for s_key, s_info in skus_data.items():
                sku_id = str(s_info.get("id") or "")
                v_sku = f"{base_sku}{sku_id}" if sku_id else f"{base_sku}{s_key}"
                sku_name = s_info.get("sku_name", "")

                feature_value_map = {}
                for part in s_key.split(";"):
                    if ":" in part:
                        fid, vid = part.split(":")
                        feature_value_map[fid.strip()] = vid.strip()

                color_feature_id = list(feature_value_map.keys())[0] if feature_value_map else None
                current_color_value = feature_value_map.get(color_feature_id) if color_feature_id else None

                target_img_id = None
                if current_color_value and current_color_value in color_values:
                    color_idx = color_values.index(current_color_value)
                    if color_idx < len(slides):
                        target_img_id = slides[color_idx].get("data-image_id")

                main_img = gallery_map.get(str(target_img_id)) if target_img_id else None
                if main_img:
                    final_photo_list = [main_img] + [p for p in all_photos if p != main_img]
                else:
                    final_photo_list = all_photos

                base_price = float(str(s_info.get("price", "0")).replace(" ", "").replace(",", ".") or 0)
                pack_qty = extract_pack_quantity(features_raw)
                final_price = base_price * pack_qty

                color = ""
                if sku_name:
                    parts = [p.strip() for p in sku_name.split(",")]
                    color = parts[-1]

                ozon_title = f"{base_title} ({color})" if color else base_title
                local_images = download_product_images_threaded(final_photo_list, v_sku)

                variants.append({
                    "sku": v_sku,
                    "sku_id_1c": sku_id,
                    "title": ozon_title,
                    "base_title": base_title,
                    "sku_name": sku_name,
                    "color": color,
                    "price": base_price,
                    "price_pack": round(final_price, 2),
                    "old_price": old_price,
                    "pack_quantity": pack_qty,
                    "description": description,
                    "url": product_url,
                    "images_original": final_photo_list,
                    "images_local": local_images,
                    "features": features_raw,
                    "features_clean": features_clean,
                })

        except Exception as e:
            print(f"Ошибка парсинга вариантов: {e}")

    if not variants:
        pack_qty = extract_pack_quantity(features_raw)
        local_images = download_product_images_threaded(all_photos, base_sku)
        product_base.update({
            "sku": base_sku,
            "sku_id_1c": "",
            "title": base_title,
            "base_title": base_title,
            "sku_name": "",
            "color": "",
            "price": 0,
            "price_pack": 0,
            "old_price": old_price,
            "pack_quantity": pack_qty,
            "description": description,
            "images_original": all_photos,
            "images_local": local_images,
        })
        variants.append(product_base)

    return variants


# ─────────────────────────────────────────────
# Обработка категории
# ─────────────────────────────────────────────

def _extract_products_from_soup(s):
    """Достаёт (product_urls, price_map) из уже распарсенного листинга категории."""
    product_urls = []
    price_map = {}
    for a in s.select("a.product-thumb__name"):
        p_url = urljoin(BASE_URL, a["href"])
        product_urls.append(p_url)

        price_text = None
        thumb = a.find_parent(class_=lambda c: c and "product-thumb" in c)
        container = thumb or a.parent
        if container:
            price_tag = container.select_one(
                ".product-thumb__price, .price, .product-price, [class*='price']"
            )
            if price_tag:
                price_text = price_tag.get_text(" ", strip=True)

        price_map[p_url] = price_text

    return product_urls, price_map


def fetch_category_page(url, page):
    """
    Запрашивает ОДНУ страницу пагинации категории.
    page=1 -> сам url, page>1 -> url?page=N (пагинация Webasyst Shop-Script,
    подтверждена на живом сайте: .../vodostoki/plastikovye/docke/?page=2 и т.д.)
    Возвращает (soup, product_urls, price_map); soup=None при ошибке.
    """
    page_url = url if page == 1 else f"{url.rstrip('/')}/?page={page}"
    r = request_with_retry(page_url, timeout=10)
    if r is None:
        return None, [], {}
    try:
        s = BeautifulSoup(r.text, "html.parser")
    except Exception:
        return None, [], {}
    product_urls, price_map = _extract_products_from_soup(s)
    return s, product_urls, price_map


def fetch_category_listing(url):
    """
    Обходит ВСЕ страницы пагинации категории (?page=2, ?page=3, ...), а не
    только первую (это и была причина обрезания на ~24 товарах). Останавливается,
    когда очередная страница не приносит новых товаров, а не на фиксированном
    количестве. Возвращает (cat_name, soup_первой_страницы, все_product_urls, price_map)
    — сигнатура не изменилась, чтобы process_category() и остальной код работали как раньше.
    """
    first_soup, first_urls, first_prices = fetch_category_page(url, 1)
    if first_soup is None:
        return url.strip("/").split("/")[-1], None, [], {}

    cat_name_tag = first_soup.select_one("h1, .category-title, .breadcrumb-item.active")
    cat_name = cat_name_tag.get_text(strip=True) if cat_name_tag else url.strip("/").split("/")[-1]

    all_urls = list(first_urls)
    all_prices = dict(first_prices)
    seen = set(first_urls)

    page = 2
    empty_streak = 0
    pages_fetched = 1
    while True:
        _, page_urls, page_prices = fetch_category_page(url, page)
        new_urls = [u for u in page_urls if u not in seen]

        if not page_urls or not new_urls:
            # Пустая страница или сайт вернул уже виденные товары (вышли за
            # пределы пагинации) — считаем это концом категории. Проверяем
            # два раза подряд на случай единичного сбойного ответа.
            empty_streak += 1
            if empty_streak >= 2 or not page_urls:
                break
        else:
            empty_streak = 0
            for u in new_urls:
                seen.add(u)
                all_urls.append(u)
                all_prices[u] = page_prices.get(u)
            pages_fetched += 1

        page += 1
        if page > 200:
            log_progress(f"  ⚠️  Защитный лимит в 200 страниц пагинации достигнут для {url}")
            break

    if pages_fetched > 1:
        log_progress(f"  📄 {url} — обойдено страниц: {pages_fetched}, товаров: {len(all_urls)}")

    return cat_name, first_soup, all_urls, all_prices


def fetch_category_listing_full(url):
    """
    Как fetch_category_listing(), но дополнительно обходит (с полной пагинацией
    каждой) все дочерние страницы бренда/серии/комплектующих из SUBCATEGORY_MAP,
    найденные в основной навигации сайта, и объединяет товары в один список.

    Именно так находятся товары вроде "Жёлоб Premium" / "Воронка Premium"
    (лежат на /vodostoki/plastikovye/docke/, а не на /vodostoki/plastikovye/)
    или комплектующие винилового сайдинга (лежат на /sayding/vinilovyy/docke/,
    /sayding/vinilovyy/grand-line/ и т.д.) — раньше эти страницы вообще не
    входили в обход, независимо от пагинации.

    Схема (slug/url) итоговой категории НЕ меняется — просто становится полнее.
    """
    cat_name, first_soup, all_urls, all_prices = fetch_category_listing(url)
    if first_soup is None:
        return cat_name, first_soup, all_urls, all_prices

    seen = set(all_urls)
    children = SUBCATEGORY_MAP.get(url, [])
    for child_url in children:
        _child_name, _child_soup, child_urls, child_prices = fetch_category_listing(child_url)
        new_from_child = [u for u in child_urls if u not in seen]
        if new_from_child:
            log_progress(f"  ➕ {child_url} (подкатегория {url}) — новых товаров: {len(new_from_child)}")
        for u in new_from_child:
            seen.add(u)
            all_urls.append(u)
            all_prices[u] = child_prices.get(u)

    return cat_name, first_soup, all_urls, all_prices


def process_category(url, soup=None, product_urls=None):
    cat_slug = url.strip("/").split("/")[-1]

    if soup is None or product_urls is None:
        cat_name, s, product_urls, _ = fetch_category_listing_full(url)
    else:
        s = soup
        cat_name_tag = s.select_one("h1, .category-title, .breadcrumb-item.active") if s else None
        cat_name = cat_name_tag.get_text(strip=True) if cat_name_tag else cat_slug

    print(f"\n{'=' * 50}")
    print(f"📂 {cat_slug} / {cat_name}")

    total = len(product_urls)
    print(f"🛒 Товаров: {total}")

    all_results = []
    done = 0

    future_to_url = {PRODUCT_EXECUTOR.submit(parse_product_details, p_url): p_url for p_url in product_urls}
    for f in concurrent.futures.as_completed(future_to_url):
        p_url = future_to_url[f]
        done += 1
        res = f.result()
        if res:
            all_results.extend(res)
            print(f"  [{done}/{total}] ✅ {p_url.split('/')[-2]} — вариантов: {len(res)}")
        else:
            print(f"  [{done}/{total}] ⚠️  {p_url.split('/')[-2]} — пусто")

    products_by_base = {}
    for item in all_results:
        key = item.get("url", item["sku"])
        if key not in products_by_base:
            raw_path = key.replace("https://mk4s.ru/", "").replace("http://mk4s.ru/", "")
            seo_slug = raw_path.strip("/").replace("/", "--")
            if not seo_slug:
                seo_slug = item["sku"][:20]

            products_by_base[key] = {
                "id": seo_slug,
                "sku_base": item["sku"][:10],
                "title": item["base_title"] or item["title"],
                "description": item["description"],
                "url": item["url"],
                "features": item["features"],
                "variants": [],
            }
        products_by_base[key]["variants"].append({
            "sku": item["sku"],
            "sku_id_1c": item.get("sku_id_1c", ""),
            "sku_name": item.get("sku_name", ""),
            "color": item.get("color", ""),
            "price": item["price"],
            "price_pack": item["price_pack"],
            "old_price": item.get("old_price", ""),
            "pack_quantity": item.get("pack_quantity", 1),
            "images": item.get("images_local", item.get("images_original", [])),
        })

    return {
        "slug": cat_slug,
        "name": cat_name,
        "url": url,
        "products": list(products_by_base.values()),
    }


# Автоматически извлечено из основной навигации сайта mk4s.ru
# (обход подкатегорий/брендов внутри уже существующих категорий CATEGORY_TREE).
# Для каждой категории верхнего уровня указаны её дочерние страницы
# (бренды, серии, комплектующие), которые раньше не обходились парсером
# и поэтому их товары (например, Docke Premium в vodostoki/plastikovye,
# или Docke/Grand Line/Технониколь/Текос в sayding/vinilovyy) отсутствовали.
SUBCATEGORY_MAP = {
    "https://mk4s.ru/krovlya/myagkaya-krovlya/": [
        "https://mk4s.ru/krovlya/myagkaya-krovlya/katepal/",  # Катепал
        "https://mk4s.ru/krovlya/myagkaya-krovlya/docke/",  # Деке
        "https://mk4s.ru/krovlya/myagkaya-krovlya/tehnonikol/",  # Технониколь Shinglas
        "https://mk4s.ru/krovlya/myagkaya-krovlya/quiet-tile/",  # Quiet-Tile
        "https://mk4s.ru/krovlya/myagkaya-krovlya/tegola/",  # Тегола
        "https://mk4s.ru/krovlya/myagkaya-krovlya/ruflex/",  # Ruflex
        "https://mk4s.ru/krovlya/myagkaya-krovlya/certainteed/",  # Certainteed
        "https://mk4s.ru/krovlya/myagkaya-krovlya/podkladochnyy-kover/",  # Подкладочный ковер
    ],
    "https://mk4s.ru/krovlya/metallocherepitsa/": [
        "https://mk4s.ru/krovlya/metallocherepitsa/stynergy/",  # Стинержи
        "https://mk4s.ru/krovlya/metallocherepitsa/grand-line/",  # Grand Line
        "https://mk4s.ru/krovlya/metallocherepitsa/metallprofil/",  # Металлпрофиль
        "https://mk4s.ru/krovlya/metallocherepitsa/aquasystem/",  # Аквасистем
        "https://mk4s.ru/krovlya/metallocherepitsa/interprofil/",  # Интерпрофиль
        "https://mk4s.ru/krovlya/metallocherepitsa/steelx/",  # Steelx
        "https://mk4s.ru/krovlya/metallocherepitsa/monterrey/",  # Монтеррей
        "https://mk4s.ru/krovlya/metallocherepitsa/tolshchina-05-mm/",  # Толщина 0.5 мм
    ],
    "https://mk4s.ru/krovlya/profnastil/": [
        "https://mk4s.ru/krovlya/profnastil/stynergy/",  # Stynergy
        "https://mk4s.ru/krovlya/profnastil/profnastil-steelx/",  # Steelx
        "https://mk4s.ru/krovlya/profnastil/grand-line/",  # Гранд лайн
        "https://mk4s.ru/krovlya/profnastil/mp-20/",  # Профнастил МП-20
        "https://mk4s.ru/krovlya/profnastil/otsinkovannyy/",  # Оцинкованный
        "https://mk4s.ru/krovlya/profnastil/s8/",  # Профиль С8
        "https://mk4s.ru/krovlya/profnastil/s20/",  # Профиль С20
        "https://mk4s.ru/krovlya/profnastil/s21/",  # Профиль С21
        "https://mk4s.ru/krovlya/profnastil/n75/",  # Профиль Н75
        "https://mk4s.ru/krovlya/profnastil/ns35/",  # Профиль НС35
        "https://mk4s.ru/krovlya/profnastil/n60/",  # Профиль Н60
        "https://mk4s.ru/krovlya/profnastil/profnastil-dlya-sten/",  # Для стен
    ],
    "https://mk4s.ru/krovlya/kompozitnaya-cherepitsa/": [
        "https://mk4s.ru/krovlya/kompozitnaya-cherepitsa/metrotile/",  # Metrotile
        "https://mk4s.ru/krovlya/kompozitnaya-cherepitsa/aerodek/",  # Aerodek
        "https://mk4s.ru/krovlya/kompozitnaya-cherepitsa/luxard-tehnonikol/",  # Luxard Технониколь
        "https://mk4s.ru/krovlya/kompozitnaya-cherepitsa/gerard/",  # Gerard
    ],
    "https://mk4s.ru/krovlya/tsementno-peschanaya-cherepitsa/": [
        "https://mk4s.ru/krovlya/tsementno-peschanaya-cherepitsa/kriastak/",  # Kriastak
        "https://mk4s.ru/krovlya/tsementno-peschanaya-cherepitsa/zabudova/",  # Забудова
        "https://mk4s.ru/krovlya/tsementno-peschanaya-cherepitsa/braas/",  # Braas
    ],
    "https://mk4s.ru/krovlya/falcevaya-krovlya/": [
        "https://mk4s.ru/krovlya/falcevaya-krovlya/stinerzhi/",  # Стинержи
        "https://mk4s.ru/krovlya/falcevaya-krovlya/grand-line/",  # Grand Line
        "https://mk4s.ru/krovlya/falcevaya-krovlya/armo/",  # Armo
        "https://mk4s.ru/krovlya/falcevaya-krovlya/akvasistem/",  # Аквасистем
    ],
    "https://mk4s.ru/krovlya/keramicheskaya-cherepitsa/": [
        "https://mk4s.ru/krovlya/keramicheskaya-cherepitsa/nelskamp/",  # Nelskamp
        "https://mk4s.ru/krovlya/keramicheskaya-cherepitsa/koramic/",  # Koramic
        "https://mk4s.ru/krovlya/keramicheskaya-cherepitsa/maruso/",  # Maruso
        "https://mk4s.ru/krovlya/keramicheskaya-cherepitsa/tejas-borja/",  # Tejas Borja
        "https://mk4s.ru/krovlya/keramicheskaya-cherepitsa/tondach/",  # Tondach
        "https://mk4s.ru/krovlya/keramicheskaya-cherepitsa/creaton/",  # Creaton
        "https://mk4s.ru/krovlya/keramicheskaya-cherepitsa/erlus/",  # Erlus
        "https://mk4s.ru/krovlya/keramicheskaya-cherepitsa/braas/",  # Braas
        "https://mk4s.ru/krovlya/keramicheskaya-cherepitsa/rongguan/",  # Rongguan
        "https://mk4s.ru/krovlya/keramicheskaya-cherepitsa/mladost/",  # Mladost
        "https://mk4s.ru/krovlya/keramicheskaya-cherepitsa/abc/",  # ABC
    ],
    "https://mk4s.ru/krovlya/ekspluatiruemaya-krovlya/": [
        "https://mk4s.ru/krovlya/ekspluatiruemaya-krovlya/rulonnaya/",  # Рулонный кровельный материал
        "https://mk4s.ru/krovlya/ekspluatiruemaya-krovlya/reguliruemye-opory/",  # Регулируемые опоры
    ],
    "https://mk4s.ru/sayding/cokolnyy/": [
        "https://mk4s.ru/sayding/cokolnyy/docke/",  # Docke
        "https://mk4s.ru/sayding/cokolnyy/canada-ridge/",  # Канада Ридж
    ],
    "https://mk4s.ru/sayding/vinilovyy/": [
        "https://mk4s.ru/sayding/vinilovyy/docke/",  # Docke
        "https://mk4s.ru/sayding/vinilovyy/grand-line/",  # Гранд Лайн
        "https://mk4s.ru/sayding/vinilovyy/tekhnonikol/",  # Технониколь
        "https://mk4s.ru/sayding/vinilovyy/tecos/",  # Текос
    ],
    "https://mk4s.ru/sayding/metallicheskiy/": [
        "https://mk4s.ru/sayding/metallicheskiy/grand-line/",  # Гранд Лайн
        "https://mk4s.ru/sayding/metallicheskiy/stynergy/",  # Стинержи
        "https://mk4s.ru/sayding/metallicheskiy/aquasystem/",  # Аквасистем
    ],
    "https://mk4s.ru/sayding/fibrotsementnyy/": [
        "https://mk4s.ru/sayding/fibrotsementnyy/roofas/",  # Roofas
        "https://mk4s.ru/sayding/fibrotsementnyy/cedral/",  # Cedral
        "https://mk4s.ru/sayding/fibrotsementnyy/decover/",  # Decover
        "https://mk4s.ru/sayding/fibrotsementnyy/beteko/",  # Бетэко
        "https://mk4s.ru/sayding/fibrotsementnyy/fibrostar/",  # Фибростар
        "https://mk4s.ru/sayding/fibrotsementnyy/fibratek/",  # Фибратек
    ],
    "https://mk4s.ru/sayding/pod-brevno/": [
        "https://mk4s.ru/sayding/pod-brevno/docke/",  # Docke
        "https://mk4s.ru/sayding/pod-brevno/tekos/",  # Текос
    ],
    "https://mk4s.ru/sayding/sofity/": [
        "https://mk4s.ru/sayding/sofity/docke/",  # Docke
        "https://mk4s.ru/sayding/sofity/aquasystem/",  # Аквасистем
        "https://mk4s.ru/sayding/sofity/grand-line/",  # Гранд Лайн
        "https://mk4s.ru/sayding/sofity/tekhnonikol/",  # Технониколь
        "https://mk4s.ru/sayding/sofity/tecos/",  # Tecos
        "https://mk4s.ru/sayding/sofity/pod-derevo/",  # Под дерево
        "https://mk4s.ru/sayding/sofity/metallicheskie/",  # Металлические
        "https://mk4s.ru/sayding/sofity/perforirovannye/",  # Перфорированные
    ],
    "https://mk4s.ru/fasadnye-materialy/fasadnye-paneli/": [
        "https://mk4s.ru/fasadnye-materialy/fasadnye-paneli/docke/",  # Docke
        "https://mk4s.ru/fasadnye-materialy/fasadnye-paneli/tekhnonikol/",  # Технониколь
        "https://mk4s.ru/fasadnye-materialy/fasadnye-paneli/ya-fasad/",  # Я-Фасад
        "https://mk4s.ru/fasadnye-materialy/fasadnye-paneli/grand-line/",  # Grand Line
        "https://mk4s.ru/fasadnye-materialy/fasadnye-paneli/tecos/",  # Tecos
        "https://mk4s.ru/fasadnye-materialy/fasadnye-paneli/canada-ridge/",  # Canada Ridge
        "https://mk4s.ru/fasadnye-materialy/fasadnye-paneli/pod-kirpich/",  # Под кирпич
        "https://mk4s.ru/fasadnye-materialy/fasadnye-paneli/pod-kamen/",  # Под камень
        "https://mk4s.ru/fasadnye-materialy/fasadnye-paneli/pod-derevo/",  # Под дерево
    ],
    "https://mk4s.ru/fasadnye-materialy/termopaneli-fasadnye/": [
        "https://mk4s.ru/fasadnye-materialy/termopaneli-fasadnye/alyaska/",  # Аляска
    ],
    "https://mk4s.ru/fasadnye-materialy/fasadnaya-plitka/": [
        "https://mk4s.ru/fasadnye-materialy/fasadnaya-plitka/tekhnonikol-hauberk/",  # Технониколь Hauberk
        "https://mk4s.ru/fasadnye-materialy/fasadnaya-plitka/docke/",  # Docke
        "https://mk4s.ru/fasadnye-materialy/fasadnaya-plitka/pod-kamen/",  # Под камень
        "https://mk4s.ru/fasadnye-materialy/fasadnaya-plitka/pod-kirpich/",  # Под кирпич
    ],
    "https://mk4s.ru/vodostoki/metallicheskie/": [
        "https://mk4s.ru/vodostoki/metallicheskie/ranilla/",  # Ranilla
        "https://mk4s.ru/vodostoki/metallicheskie/interprofil/",  # Интерпрофиль
        "https://mk4s.ru/vodostoki/metallicheskie/aquasystem/",  # Аквасистем
        "https://mk4s.ru/vodostoki/metallicheskie/stynergy/",  # Стинержи
        "https://mk4s.ru/vodostoki/metallicheskie/grand-line/",  # Гранд лайн
        "https://mk4s.ru/vodostoki/metallicheskie/glc/",  # Водосток GLC
    ],
    "https://mk4s.ru/vodostoki/plastikovye/": [
        "https://mk4s.ru/vodostoki/plastikovye/docke/",  # Деке
    ],
    "https://mk4s.ru/vodostoki/mednye/": [
        "https://mk4s.ru/vodostoki/mednye/aquasystem/",  # Аквасистем
    ],
    "https://mk4s.ru/drenazh/drenazh-bez-shchebnya/": [
        "https://mk4s.ru/drenazh/drenazh-bez-shchebnya/lightdrain/",  # Лайтдрэин
    ],
    "https://mk4s.ru/drenazh/steelot/": [
        "https://mk4s.ru/drenazh/steelot/lotki/",  # Лотки линейного водоотвода
        "https://mk4s.ru/drenazh/steelot/tochechnyy-vodootvod/",  # Точечный водоотвод
        "https://mk4s.ru/drenazh/steelot/livnevye-reshetki/",  # Ливневые решетки
    ],
    "https://mk4s.ru/drenazh/drenline/": [
        "https://mk4s.ru/drenazh/drenline/lineynyy-vodootvod/",  # Линейный водоотвод
        "https://mk4s.ru/drenazh/drenline/tochechnyj-vodootvod/",  # Точечный водоотвод
        "https://mk4s.ru/drenazh/drenline/reshetchatyj-nastil/",  # Решетчатый настил
    ],
    "https://mk4s.ru/drenazh/gazonnaya-reshetka/": [
        "https://mk4s.ru/drenazh/gazonnaya-reshetka/ekoparkovka/",  # Экопарковка
    ],
    "https://mk4s.ru/izolyatsiya/uteplitel/": [
        "https://mk4s.ru/izolyatsiya/uteplitel/paroc/",  # Paroc
        "https://mk4s.ru/izolyatsiya/uteplitel/umatex/",  # Umatex
        "https://mk4s.ru/izolyatsiya/uteplitel/rockwool/",  # Роквул
        "https://mk4s.ru/izolyatsiya/uteplitel/knauf/",  # Knauf
        "https://mk4s.ru/izolyatsiya/uteplitel/tehnonikol/",  # Технониколь Роклайт
        "https://mk4s.ru/izolyatsiya/uteplitel/izolife/",  # Изолайф
        "https://mk4s.ru/izolyatsiya/uteplitel/dirock/",  # Dirock
        "https://mk4s.ru/izolyatsiya/uteplitel/ursa/",  # Ursa
        "https://mk4s.ru/izolyatsiya/uteplitel/isover/",  # Isover
        "https://mk4s.ru/izolyatsiya/uteplitel/isoroc/",  # Изорок
        "https://mk4s.ru/izolyatsiya/uteplitel/penofol/",  # Пенофол
        "https://mk4s.ru/izolyatsiya/uteplitel/bazaltovaya-vata/",  # Базальтовая вата
        "https://mk4s.ru/izolyatsiya/uteplitel/mineralnaya-vata/",  # Минеральная вата
        "https://mk4s.ru/izolyatsiya/uteplitel/kamennaya-vata/",  # Каменная вата
        "https://mk4s.ru/izolyatsiya/uteplitel/penopolistirol/",  # Пенополистирол
    ],
    "https://mk4s.ru/izolyatsiya/paroizolyatsiya/": [
        "https://mk4s.ru/izolyatsiya/paroizolyatsiya/tehnonikol/",  # Технониколь
        "https://mk4s.ru/izolyatsiya/paroizolyatsiya/ondutis/",  # Ондутис
        "https://mk4s.ru/izolyatsiya/paroizolyatsiya/delta/",  # Delta
        "https://mk4s.ru/izolyatsiya/paroizolyatsiya/fakro/",  # Fakro
        "https://mk4s.ru/izolyatsiya/paroizolyatsiya/finka/",  # Finka
        "https://mk4s.ru/izolyatsiya/paroizolyatsiya/katepal/",  # Katepal
        "https://mk4s.ru/izolyatsiya/paroizolyatsiya/tyvek/",  # Tyvek
        "https://mk4s.ru/izolyatsiya/paroizolyatsiya/rothoblaas/",  # RothoBlaas
        "https://mk4s.ru/izolyatsiya/paroizolyatsiya/yutafol/",  # Ютафол
        "https://mk4s.ru/izolyatsiya/paroizolyatsiya/docke/",  # Docke
        "https://mk4s.ru/izolyatsiya/paroizolyatsiya/tegola/",  # Tegola
        "https://mk4s.ru/izolyatsiya/paroizolyatsiya/klober/",  # Клобер
        "https://mk4s.ru/izolyatsiya/paroizolyatsiya/eurovent/",  # Eurovent
    ],
    "https://mk4s.ru/izolyatsiya/superdiffuzionnye-membrany/": [
        "https://mk4s.ru/izolyatsiya/superdiffuzionnye-membrany/tekhnonikol/",  # Технониколь
        "https://mk4s.ru/izolyatsiya/superdiffuzionnye-membrany/delta/",  # Delta
        "https://mk4s.ru/izolyatsiya/superdiffuzionnye-membrany/ondutis/",  # Ондутис
        "https://mk4s.ru/izolyatsiya/superdiffuzionnye-membrany/fakro/",  # Fakro
        "https://mk4s.ru/izolyatsiya/superdiffuzionnye-membrany/rothoblaas/",  # RothoBlaas
        "https://mk4s.ru/izolyatsiya/superdiffuzionnye-membrany/katepal/",  # Katepal
        "https://mk4s.ru/izolyatsiya/superdiffuzionnye-membrany/docke/",  # Docke
        "https://mk4s.ru/izolyatsiya/superdiffuzionnye-membrany/tyvek/",  # Tyvek
        "https://mk4s.ru/izolyatsiya/superdiffuzionnye-membrany/tegola/",  # Tegola
        "https://mk4s.ru/izolyatsiya/superdiffuzionnye-membrany/klober/",  # Klober
        "https://mk4s.ru/izolyatsiya/superdiffuzionnye-membrany/finka/",  # Finka
        "https://mk4s.ru/izolyatsiya/superdiffuzionnye-membrany/eurovent/",  # Eurovent
    ],
    "https://mk4s.ru/izolyatsiya/vetrozashchita/": [
        "https://mk4s.ru/izolyatsiya/vetrozashchita/ondutis/",  # Ондутис
        "https://mk4s.ru/izolyatsiya/vetrozashchita/docke/",  # Docke
        "https://mk4s.ru/izolyatsiya/vetrozashchita/knauf/",  # Knauf
        "https://mk4s.ru/izolyatsiya/vetrozashchita/beltermo/",  # Белтермо
        "https://mk4s.ru/izolyatsiya/vetrozashchita/gyproc/",  # Gyproc
    ],
    "https://mk4s.ru/izolyatsiya/gidroizolyatsiya/": [
        "https://mk4s.ru/izolyatsiya/gidroizolyatsiya/ondutis/",  # Ондутис
        "https://mk4s.ru/izolyatsiya/gidroizolyatsiya/docke/",  # Docke
        "https://mk4s.ru/izolyatsiya/gidroizolyatsiya/delta/",  # Delta
        "https://mk4s.ru/izolyatsiya/gidroizolyatsiya/yutafol/",  # Ютафол
        "https://mk4s.ru/izolyatsiya/gidroizolyatsiya/klober/",  # Клобер
    ],
    "https://mk4s.ru/izolyatsiya/germetiziruyuschaya-lenta/": [
        "https://mk4s.ru/izolyatsiya/germetiziruyuschaya-lenta/vesi-este/",  # Vesi Este
        "https://mk4s.ru/izolyatsiya/germetiziruyuschaya-lenta/nicoband/",  # Nicoband Технониколь
        "https://mk4s.ru/izolyatsiya/germetiziruyuschaya-lenta/wakaflex/",  # Вакафлекс
        "https://mk4s.ru/izolyatsiya/germetiziruyuschaya-lenta/onduband/",  # Ондубанд
        "https://mk4s.ru/izolyatsiya/germetiziruyuschaya-lenta/ranilla/",  # Ranilla
        "https://mk4s.ru/izolyatsiya/germetiziruyuschaya-lenta/ekobit/",  # Экобит
    ],
    "https://mk4s.ru/ventilyatsiya-krovli/aeratory/": [
        "https://mk4s.ru/ventilyatsiya-krovli/aeratory/aquasystem/",  # Аквасистем
        "https://mk4s.ru/ventilyatsiya-krovli/aeratory/tehnonikol/",  # Технониколь
        "https://mk4s.ru/ventilyatsiya-krovli/aeratory/polivent/",  # Поливент
        "https://mk4s.ru/ventilyatsiya-krovli/aeratory/deke/",  # Деке
    ],
    "https://mk4s.ru/ventilyatsiya-krovli/konkovye-aeratory/": [
        "https://mk4s.ru/ventilyatsiya-krovli/konkovye-aeratory/shingle-vent/",  # Shingle Vent
        "https://mk4s.ru/ventilyatsiya-krovli/konkovye-aeratory/docke/",  # Docke
        "https://mk4s.ru/ventilyatsiya-krovli/konkovye-aeratory/ridge-master/",  # Ridge Master
    ],
    "https://mk4s.ru/ventilyatsiya-krovli/ventilyatsionnye-vyhody/": [
        "https://mk4s.ru/ventilyatsiya-krovli/ventilyatsionnye-vyhody/vilpe/",  # Vilpe
        "https://mk4s.ru/ventilyatsiya-krovli/ventilyatsionnye-vyhody/krovent/",  # Krovent
        "https://mk4s.ru/ventilyatsiya-krovli/ventilyatsionnye-vyhody/docke/",  # Docke
        "https://mk4s.ru/ventilyatsiya-krovli/ventilyatsionnye-vyhody/wirplast/",  # Wirplast
        "https://mk4s.ru/ventilyatsiya-krovli/ventilyatsionnye-vyhody/polivent/",  # Поливент
    ],
    "https://mk4s.ru/ventilyatsiya-krovli/prohodnye-elementy/": [
        "https://mk4s.ru/ventilyatsiya-krovli/prohodnye-elementy/vilpe/",  # Vilpe
        "https://mk4s.ru/ventilyatsiya-krovli/prohodnye-elementy/docke/",  # Docke
    ],
    "https://mk4s.ru/krovli/flyugery/": [
        "https://mk4s.ru/krovli/flyugery/duck-dog/",  # Duck and Dog
    ],
    "https://mk4s.ru/krovli/greyushchiy-kabel/": [
        "https://mk4s.ru/krovli/greyushchiy-kabel/devi/",  # Devi
    ],
    "https://mk4s.ru/krovli/germetiki/": [
        "https://mk4s.ru/krovli/germetiki/kesto/",  # Kesto
        "https://mk4s.ru/krovli/germetiki/tehnonikol/",  # Технониколь
        "https://mk4s.ru/krovli/germetiki/sikaflex/",  # Sikaflex
        "https://mk4s.ru/krovli/germetiki/soudal/",  # Soudal
    ],
    "https://mk4s.ru/drevesno-plitnye-materialy/plita-osb-osp/": [
        "https://mk4s.ru/drevesno-plitnye-materialy/plita-osb-osp/talion/",  # Ultralam
        "https://mk4s.ru/drevesno-plitnye-materialy/plita-osb-osp/kronospan/",  # Kronospan
        "https://mk4s.ru/drevesno-plitnye-materialy/plita-osb-osp/kalevala/",  # Калевала
        "https://mk4s.ru/drevesno-plitnye-materialy/plita-osb-osp/vlagostoykaya/",  # Влагостойкие ОСБ
        "https://mk4s.ru/drevesno-plitnye-materialy/plita-osb-osp/osb-9-mm/",  # OSB 9 мм
        "https://mk4s.ru/drevesno-plitnye-materialy/plita-osb-osp/osb-12-mm/",  # OSB 12 мм
        "https://mk4s.ru/drevesno-plitnye-materialy/plita-osb-osp/osb-1250-2500-mm/",  # 1250х2500 мм
    ],
    "https://mk4s.ru/zabory/profnastil-dlya-zabora/": [
        "https://mk4s.ru/zabory/profnastil-dlya-zabora/pod-derevo/",  # Под дерево
        "https://mk4s.ru/zabory/profnastil-dlya-zabora/calculator/",  # Калькулятор
        "https://mk4s.ru/zabory/profnastil-dlya-zabora/stolby/",  # Столбы
    ],
    "https://mk4s.ru/zabory/evroshtaketnik/": [
        "https://mk4s.ru/zabory/evroshtaketnik/lumieste/",  # LumiEste
        "https://mk4s.ru/zabory/evroshtaketnik/stynergy/",  # Stynergy
        "https://mk4s.ru/zabory/evroshtaketnik/grand-line/",  # Гранд лайн
        "https://mk4s.ru/zabory/evroshtaketnik/steelx/",  # Steelx
        "https://mk4s.ru/zabory/evroshtaketnik/pod-derevo/",  # Под дерево
        "https://mk4s.ru/zabory/evroshtaketnik/dvuhstoronniy/",  # Двухсторонний
        "https://mk4s.ru/zabory/evroshtaketnik/odnostoronniy/",  # Односторонний
        "https://mk4s.ru/zabory/evroshtaketnik/m-obraznyy/",  # М-образный
        "https://mk4s.ru/zabory/evroshtaketnik/p-obraznyy/",  # П-образный
    ],
    "https://mk4s.ru/blagoustroystvo/sad/": [
        "https://mk4s.ru/blagoustroystvo/sad/gryadki-iz-dpk/",  # Грядки из ДПК
        "https://mk4s.ru/blagoustroystvo/sad/kompostery-plastikovye/",  # Компостеры пластиковые
        "https://mk4s.ru/blagoustroystvo/sad/saray-hozblok/",  # Сараи, хозблоки
        "https://mk4s.ru/blagoustroystvo/sad/polennitsy/",  # Поленницы
        "https://mk4s.ru/blagoustroystvo/sad/tsvetochnitsy/",  # Цветочницы горшки
        "https://mk4s.ru/blagoustroystvo/sad/sistemy-hraneniya/",  # Системы хранения для улицы
    ],
    "https://mk4s.ru/blagoustroystvo/ulichnaya-mebel/": [
        "https://mk4s.ru/blagoustroystvo/ulichnaya-mebel/mebel-iz-iskusstvennogo-rotanga/",  # Мебель под ротанг
        "https://mk4s.ru/blagoustroystvo/ulichnaya-mebel/komplekty-sadovoy-mebeli/",  # Комплекты садовой мебели
        "https://mk4s.ru/blagoustroystvo/ulichnaya-mebel/mebel-dlya-kafe-restoranov/",  # Мебель для кафе и ресторанов
        "https://mk4s.ru/blagoustroystvo/ulichnaya-mebel/sadovye-kacheli/",  # Садовые качели
    ],
}


# ─────────────────────────────────────────────
# ДЕРЕВО КАТЕГОРИЙ
# ─────────────────────────────────────────────

CATEGORY_TREE = {
    "krovlya": ("Кровля", [
        "https://mk4s.ru/krovlya/myagkaya-krovlya/",
        "https://mk4s.ru/krovlya/metallocherepitsa/",
        "https://mk4s.ru/krovlya/volnovoy-profil/",
        "https://mk4s.ru/krovlya/profnastil/",
        "https://mk4s.ru/krovlya/kompozitnaya-cherepitsa/",
        "https://mk4s.ru/krovlya/tsementno-peschanaya-cherepitsa/",
        "https://mk4s.ru/krovlya/ondulin/",
        "https://mk4s.ru/krovlya/onduvilla/",
        "https://mk4s.ru/krovlya/falcevaya-krovlya/",
        "https://mk4s.ru/krovlya/fibrocementnyy-slanec/",
        "https://mk4s.ru/krovlya/keramicheskaya-cherepitsa/",
        "https://mk4s.ru/krovlya/ekspluatiruemaya-krovlya/",
    ]),
    "sayding": ("Сайдинг", [
        "https://mk4s.ru/sayding/cokolnyy/",
        "https://mk4s.ru/sayding/vinilovyy/",
        "https://mk4s.ru/sayding/metallicheskiy/",
        "https://mk4s.ru/sayding/fibrotsementnyy/",
        "https://mk4s.ru/sayding/pod-brevno/",
        "https://mk4s.ru/sayding/pod-kamen/",
        "https://mk4s.ru/sayding/pod-derevo/",
        "https://mk4s.ru/sayding/pod-brus/",
        "https://mk4s.ru/sayding/pod-kirpich/",
        "https://mk4s.ru/sayding/sofity/",
        "https://mk4s.ru/sayding/obreshetka/",
    ]),
    "fasadnye-materialy": ("Фасады", [
        "https://mk4s.ru/fasadnye-materialy/fasadnye-paneli/",
        "https://mk4s.ru/fasadnye-materialy/termopaneli-fasadnye/",
        "https://mk4s.ru/fasadnye-materialy/fasadnaya-plitka/",
        "https://mk4s.ru/fasadnye-materialy/fibrotsementnye-paneli/",
        "https://mk4s.ru/fasadnye-materialy/sendvich-paneli/",
        "https://mk4s.ru/fasadnye-materialy/planken/",
        "https://mk4s.ru/fasadnye-materialy/stenovye-paneli-pvh/",
    ]),
    "vodostoki": ("Водостоки", [
        "https://mk4s.ru/vodostoki/metallicheskie/",
        "https://mk4s.ru/vodostoki/plastikovye/",
        "https://mk4s.ru/vodostoki/mednye/",
        "https://mk4s.ru/vodostoki/otsinkovannye/",
    ]),
    "drenazh": ("Дренажные системы", [
        "https://mk4s.ru/drenazh/drenazh-bez-shchebnya/",
        "https://mk4s.ru/drenazh/steelot/",
        "https://mk4s.ru/drenazh/gidrolica/",
        "https://mk4s.ru/drenazh/drenline/",
        "https://mk4s.ru/drenazh/gazonnaya-reshetka/",
    ]),
    "terrasnaya-doska-dpk": ("Террасная доска ДПК", [
        "https://mk4s.ru/terrasnaya-doska-dpk/treedeck/",
        "https://mk4s.ru/terrasnaya-doska-dpk/terrapol/",
        "https://mk4s.ru/terrasnaya-doska-dpk/deckart/",
        "https://mk4s.ru/terrasnaya-doska-dpk/stupeni/",
    ]),
    "izolyatsiya": ("Изоляция", [
        "https://mk4s.ru/izolyatsiya/uteplitel/",
        "https://mk4s.ru/izolyatsiya/paroizolyatsiya/",
        "https://mk4s.ru/izolyatsiya/superdiffuzionnye-membrany/",
        "https://mk4s.ru/izolyatsiya/vetrozashchita/",
        "https://mk4s.ru/izolyatsiya/gidroizolyatsiya/",
        "https://mk4s.ru/izolyatsiya/germetiziruyuschaya-lenta/",
        "https://mk4s.ru/izolyatsiya/profilirovannaya-membrana/",
        "https://mk4s.ru/izolyatsiya/lenta/",
        "https://mk4s.ru/izolyatsiya/kley/",
    ]),
    "mansardnye-okna": ("Мансардные окна", [
        "https://mk4s.ru/mansardnye-okna/fakro/",
        "https://mk4s.ru/mansardnye-okna/velux/",
        "https://mk4s.ru/mansardnye-okna/derevyannye/",
        "https://mk4s.ru/mansardnye-okna/plastikovye/",
        "https://mk4s.ru/mansardnye-okna/gluhie/",
        "https://mk4s.ru/mansardnye-okna/okna-balkony/",
        "https://mk4s.ru/mansardnye-okna/okna-lyuki/",
        "https://mk4s.ru/mansardnye-okna/izolyatsionnye-oklady/",
        "https://mk4s.ru/mansardnye-okna/shtory/",
        "https://mk4s.ru/mansardnye-okna/tunneli/",
        "https://mk4s.ru/mansardnye-okna/komplekty-dlya-montazha/",
    ]),
    "cherdachnye-lestnitsy": ("Чердачные лестницы", [
        "https://mk4s.ru/cherdachnye-lestnitsy/fakro/",
        "https://mk4s.ru/cherdachnye-lestnitsy/docke/",
        "https://mk4s.ru/cherdachnye-lestnitsy/velux/",
        "https://mk4s.ru/cherdachnye-lestnitsy/minka/",
        "https://mk4s.ru/cherdachnye-lestnitsy/uteplennye/",
        "https://mk4s.ru/cherdachnye-lestnitsy/skladnye/",
        "https://mk4s.ru/cherdachnye-lestnitsy/derevyannye/",
        "https://mk4s.ru/cherdachnye-lestnitsy/metallicheskie/",
        "https://mk4s.ru/cherdachnye-lestnitsy/aksessuary/",
    ]),
    "ventilyatsiya-krovli": ("Вентиляция кровли", [
        "https://mk4s.ru/ventilyatsiya-krovli/aeratory/",
        "https://mk4s.ru/ventilyatsiya-krovli/konkovye-aeratory/",
        "https://mk4s.ru/ventilyatsiya-krovli/ventilyatsionnye-vyhody/",
        "https://mk4s.ru/ventilyatsiya-krovli/prohodnye-elementy/",
    ]),
    "krovli": ("Комплектация кровли", [
        "https://mk4s.ru/krovli/flyugery/",
        "https://mk4s.ru/krovli/greyushchiy-kabel/",
        "https://mk4s.ru/krovli/germetiki/",
    ]),
    "drevesno-plitnye-materialy": ("Древесно-плитные материалы", [
        "https://mk4s.ru/drevesno-plitnye-materialy/plita-osb-osp/",
        "https://mk4s.ru/drevesno-plitnye-materialy/mdvp/",
        "https://mk4s.ru/drevesno-plitnye-materialy/gipsokarton/",
        "https://mk4s.ru/drevesno-plitnye-materialy/dsp/",
        "https://mk4s.ru/drevesno-plitnye-materialy/quickdeck/",
    ]),
    "snegozaderzhateli": ("Снегозадержатели", [
        "https://mk4s.ru/snegozaderzhateli/ranilla/",
        "https://mk4s.ru/snegozaderzhateli/universalnye/",
        "https://mk4s.ru/snegozaderzhateli/borge/",
        "https://mk4s.ru/snegozaderzhateli/snegozaderzhateli-steelx/",
        "https://mk4s.ru/snegozaderzhateli/trubchatye/",
        "https://mk4s.ru/snegozaderzhateli/dlya-metallocherepitsy/",
        "https://mk4s.ru/snegozaderzhateli/dlya-profnastila/",
        "https://mk4s.ru/snegozaderzhateli/dlya-faltsevoy-krovli/",
        "https://mk4s.ru/snegozaderzhateli/dlya-myagkoy-krovli/",
    ]),
    "bezopasnost-krovli": ("Элементы безопасности", [
        "https://mk4s.ru/bezopasnost-krovli/krovelnye-lestnitsy/",
        "https://mk4s.ru/bezopasnost-krovli/avariynye-lestnitsy/",
        "https://mk4s.ru/bezopasnost-krovli/perekhodnye-mostiki/",
        "https://mk4s.ru/bezopasnost-krovli/ograzhdenie-krovli/",
    ]),
    "zabory": ("Заборы и ограждения", [
        "https://mk4s.ru/zabory/profnastil-dlya-zabora/",
        "https://mk4s.ru/zabory/evroshtaketnik/",
        "https://mk4s.ru/zabory/zabornaya-doska/",
        "https://mk4s.ru/zabory/ograzhdeniya-dpk/",
        "https://mk4s.ru/zabory/stolby-dlya-zabora/",
        "https://mk4s.ru/zabory/kolpaki/",
        "https://mk4s.ru/zabory/fotozabory/",
        "https://mk4s.ru/zabory/travyanoy-zabor/",
    ]),
    "krepezh": ("Крепеж", [
        "https://mk4s.ru/krepezh/gvozdi-krovelnye/",
        "https://mk4s.ru/krepezh/samorezy/",
    ]),
    "dymohody": ("Дымоходы", [
        "https://mk4s.ru/dymohody/schiedel/",
        "https://mk4s.ru/dymohody/flue-line/",
        "https://mk4s.ru/dymohody/iz-nerzhaveyushchey-stali/",
        "https://mk4s.ru/dymohody/prokhodnye-elementy/",
        "https://mk4s.ru/dymohody/flyugarka/",
    ]),
    "himiya": ("Строительная химия", [
        "https://mk4s.ru/himiya/antiseptiki/",
        "https://mk4s.ru/himiya/zashchita-drevesiny/",
        "https://mk4s.ru/himiya/ognezashchitnye-sostavy/",
        "https://mk4s.ru/himiya/zashchita-poverkhnostey/",
        "https://mk4s.ru/himiya/gruntovka/",
        "https://mk4s.ru/himiya/kley/",
        "https://mk4s.ru/himiya/antiseptik-tehnonikol/",
        "https://mk4s.ru/himiya/katepal/",
    ]),
    "floor": ("Напольные покрытия", [
        "https://mk4s.ru/floor/laminat/",
        "https://mk4s.ru/floor/plintus-napolnyy/",
    ]),
    "kozyrek-iz-polikarbonata": ("Козырьки", [
        "https://mk4s.ru/kozyrek-iz-polikarbonata/stoprain-fakro/",
    ]),
    "blagoustroystvo": ("Благоустройство участка", [
        "https://mk4s.ru/blagoustroystvo/malye-arkhitekturnye-formy/",
        "https://mk4s.ru/blagoustroystvo/sad/",
        "https://mk4s.ru/blagoustroystvo/ulichnaya-mebel/",
        "https://mk4s.ru/blagoustroystvo/teplitsy/",
        "https://mk4s.ru/blagoustroystvo/detskie-igrovye-kompleksy/",
        "https://mk4s.ru/blagoustroystvo/ulichnye-pokrytiya/",  # найдено в навигации сайта, отсутствовало в дереве
    ]),
    "suhie-smesi": ("Сухие смеси", [
        "https://mk4s.ru/suhie-smesi/kesto/",
        "https://mk4s.ru/suhie-smesi/gyproc/",
        "https://mk4s.ru/suhie-smesi/dauer/",
        "https://mk4s.ru/suhie-smesi/vetonit/",
    ]),
}


# ─────────────────────────────────────────────
# ТОЧКА ВХОДА
# ─────────────────────────────────────────────

if __name__ == "__main__":
    os.makedirs(IMAGES_SERVE_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(CATALOG_JSON_PATH), exist_ok=True)

    groups = {}
    all_categories = []
    seen_urls = set()

    for parent_slug, (parent_name, urls) in CATEGORY_TREE.items():
        groups[parent_slug] = {"name": parent_name, "categories": []}
        for url in urls:
            cat_slug = url.strip("/").split("/")[-1]
            if url not in seen_urls:
                seen_urls.add(url)
                all_categories.append((url, parent_slug))
                groups[parent_slug]["categories"].append(cat_slug)

    print(f"Групп: {len(groups)}, категорий: {len(all_categories)}")

    # ─────────────────────────────────────────────
    # ШАГ 1: быстрая разведка — обходим только листинги категорий
    # (без похода на карточки товаров), собираем сигнатуру
    # "assortment + цены" и сравниваем с прошлым запуском.
    # ─────────────────────────────────────────────
    SIGNATURE_PATH = os.path.join(REPO_ROOT, "scripts", ".catalog_signature.json")

    print("\n🔍 Быстрая проверка изменений (листинги категорий, без карточек товаров)...")
    listing_cache = {}  # url -> (cat_name, soup, product_urls)
    signature_parts = []
    prices_found = 0

    for i, (url, _parent) in enumerate(all_categories, start=1):
        cat_name, s, product_urls, price_map = fetch_category_listing_full(url)
        listing_cache[url] = (cat_name, s, product_urls)
        if i % 20 == 0 or i == len(all_categories):
            log_progress(f"  🔍 Разведка: {i}/{len(all_categories)} категорий")
        for p_url in sorted(product_urls):
            price_text = price_map.get(p_url)
            if price_text:
                prices_found += 1
            signature_parts.append(f"{p_url}::{price_text or ''}")

    new_signature = hashlib.sha256("\n".join(sorted(signature_parts)).encode("utf-8")).hexdigest()

    old_signature = None
    if os.path.exists(SIGNATURE_PATH):
        try:
            with open(SIGNATURE_PATH, "r", encoding="utf-8") as f:
                old_signature = json.load(f).get("signature")
        except Exception:
            old_signature = None

    if prices_found == 0:
        print("⚠️  Цены в листинге категорий не найдены (не совпал CSS-селектор) — "
              "сигнатура ловит только изменения ассортимента, но не цен. "
              "Продолжаю полный обход, чтобы не потерять данные о ценах.")
    elif old_signature == new_signature:
        print(f"✅ Изменений нет (ни в ассортименте, ни в ценах {prices_found} товаров с ценой в листинге) "
              f"— полный обход {sum(len(v[2]) for v in listing_cache.values())} карточек товаров и картинок пропущен.")
        PRODUCT_EXECUTOR.shutdown()
        IMAGE_EXECUTOR.shutdown()
        exit(0)
    else:
        print(f"🔄 Обнаружены изменения (цены и/или ассортимент) — запускаю полный обход товаров.")

    with open(SIGNATURE_PATH, "w", encoding="utf-8") as f:
        json.dump({"signature": new_signature, "generated_at": datetime.now().isoformat()}, f)

    # Сохраняем "было" (старый catalog.json) для отчёта о разнице ДО перезаписи.
    old_catalog_by_slug = {}
    if os.path.exists(CATALOG_JSON_PATH):
        try:
            with open(CATALOG_JSON_PATH, "r", encoding="utf-8") as f:
                old_catalog = json.load(f)
            for c in old_catalog.get("categories", []):
                old_catalog_by_slug[c.get("slug")] = len(c.get("products", []))
        except Exception as e:
            log_progress(f"⚠️  Не удалось прочитать старый catalog.json для сравнения: {e}")

    # ─────────────────────────────────────────────
    # ШАГ 2: полный обход товаров (используем уже загруженные листинги).
    # Промежуточный прогресс сохраняется каждые CHECKPOINT_EVERY_N_CATEGORIES
    # категорий — при обрыве скрипта уже собранные данные не теряются.
    # ─────────────────────────────────────────────
    CHECKPOINT_PATH = os.path.join(REPO_ROOT, "scripts", ".catalog_checkpoint.json")

    catalog_categories = []
    total_cats = len(all_categories)
    for i, (url, parent) in enumerate(all_categories, start=1):
        try:
            cat_name, s, product_urls = listing_cache[url]
            cat_data = process_category(url, soup=s, product_urls=product_urls)
            cat_data["parent"] = parent
            catalog_categories.append(cat_data)
            log_progress(f"[{i}/{total_cats}] ✅ {cat_data['slug']} — товаров: {len(cat_data['products'])}")
        except Exception as e:
            log_progress(f"⚠️  Ошибка {url}: {e}")

        if i % CHECKPOINT_EVERY_N_CATEGORIES == 0 or i == total_cats:
            try:
                with open(CHECKPOINT_PATH, "w", encoding="utf-8") as f:
                    json.dump({
                        "checkpoint_at": datetime.now().isoformat(),
                        "categories_done": i,
                        "categories_total": total_cats,
                        "categories": catalog_categories,
                    }, f, ensure_ascii=False)
                log_progress(f"  💾 Промежуточное сохранение: {i}/{total_cats} категорий")
            except Exception as e:
                log_progress(f"  ⚠️  Не удалось сохранить чекпоинт: {e}")

    catalog = {
        "meta": {
            "generated_at": datetime.now().isoformat(),
            "source": BASE_URL,
            "total_categories": len(catalog_categories),
            "total_products": sum(len(c["products"]) for c in catalog_categories),
        },
        "groups": groups,
        "categories": catalog_categories,
    }

    with open(CATALOG_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    # Успешно записали финальный catalog.json — чекпоинт больше не нужен.
    if os.path.exists(CHECKPOINT_PATH):
        try:
            os.remove(CHECKPOINT_PATH)
        except Exception:
            pass

    PRODUCT_EXECUTOR.shutdown()
    IMAGE_EXECUTOR.shutdown()

    print(f"\n✅ catalog.json → {CATALOG_JSON_PATH}")
    print(f"   Товаров: {catalog['meta']['total_products']}")

    # ─────────────────────────────────────────────
    # ШАГ 3: отчёт о разнице по каждой категории (было -> стало)
    # ─────────────────────────────────────────────
    print("\n📊 Отчёт по категориям (было → стало):")
    report_lines = ["slug\tбыло\tстало\tразница"]
    grew, shrank, unchanged, new_cats = 0, 0, 0, 0
    for c in catalog_categories:
        slug = c["slug"]
        new_count = len(c["products"])
        old_count = old_catalog_by_slug.get(slug)
        if old_count is None:
            marker = "🆕"
            new_cats += 1
            diff_str = f"новая категория, {new_count}"
        else:
            diff = new_count - old_count
            if diff > 0:
                marker = "📈"
                grew += 1
            elif diff < 0:
                marker = "📉"
                shrank += 1
            else:
                marker = "  "
                unchanged += 1
            diff_str = f"{old_count} → {new_count} ({'+' if diff >= 0 else ''}{diff})"
        report_lines.append(f"{slug}\t{old_count if old_count is not None else '-'}\t{new_count}\t{diff_str}")
        if old_count is None or new_count != old_count:
            print(f"  {marker} {slug}: {diff_str}")

    for special_slug in ("plastikovye", "vinilovyy"):
        matches = [c for c in catalog_categories if c["slug"] == special_slug]
        for c in matches:
            print(f"\n🔎 Контрольная проверка «{c['name']}» ({c['slug']}): "
                  f"{len(c['products'])} товаров (было {old_catalog_by_slug.get(special_slug, '—')})")

    print(f"\nИтого по категориям: выросло {grew}, уменьшилось {shrank}, "
          f"без изменений {unchanged}, новых {new_cats}")

    REPORT_PATH = os.path.join(REPO_ROOT, "scripts", "catalog_diff_report.tsv")
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
    print(f"📄 Полный отчёт сохранён в {REPORT_PATH}")
