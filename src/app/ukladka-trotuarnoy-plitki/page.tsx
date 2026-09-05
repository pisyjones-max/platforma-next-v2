import type { Metadata } from 'next'
import { ServiceLandingPage } from '@/components/services/ServiceLandingPage'
import { faqSchema, jsonLdScriptProps } from '@/lib/schema'
import { getService } from '@/lib/services'

const service = getService('trotuarnoy-plitki')!

export const metadata: Metadata = {
  title: service.metaTitle,
  description: service.metaDescription,
}

export default function UkladkaTrotuarnoyPlitkiPage() {
  return (
    <>
      <script {...jsonLdScriptProps(faqSchema(service.faq))} />
      <ServiceLandingPage service={service} />
    </>
  )
}
