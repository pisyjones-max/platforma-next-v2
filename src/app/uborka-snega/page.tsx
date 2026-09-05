import type { Metadata } from 'next'
import { ServiceLandingPage } from '@/components/services/ServiceLandingPage'
import { faqSchema, jsonLdScriptProps } from '@/lib/schema'
import { getService } from '@/lib/services'

const service = getService('uborki-snega')!

export const metadata: Metadata = {
  title: service.metaTitle,
  description: service.metaDescription,
}

export default function UborkaSnegaPage() {
  return (
    <>
      <script {...jsonLdScriptProps(faqSchema(service.faq))} />
      <ServiceLandingPage service={service} />
    </>
  )
}
