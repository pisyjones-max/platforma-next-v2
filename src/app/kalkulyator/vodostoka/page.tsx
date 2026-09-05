import type { Metadata } from 'next'
import { CalcLandingPage } from '@/components/calculator/CalcLandingPage'
import { faqSchema, jsonLdScriptProps } from '@/lib/schema'
import { getCalcLanding } from '@/lib/calcLandingHub'

const data = getCalcLanding('vodostoka')!

export const metadata: Metadata = {
  title: data.metaTitle,
  description: data.metaDescription,
}

export default function Page() {
  return (
    <>
      <script {...jsonLdScriptProps(faqSchema(data.faq))} />
      <CalcLandingPage data={data} />
    </>
  )
}
