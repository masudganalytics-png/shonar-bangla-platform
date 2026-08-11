import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export const BRAND_NAME = 'KHIJIRION'
export const BRAND_TAGLINE = 'EVERYTHING LOCAL, ONE PLACE'
export const SUPPORT_EMAIL = 'info@khijirion.com'
export const BRAND_URL = 'https://khijirion.com'
export const LOGO_URL = 'https://khijirion.com/pwa-192x192.png'

export const colors = {
  black: '#141210',
  gold: '#C9A227',
  goldDeep: '#A8801B',
  text: '#3f3d3a',
  muted: '#8b8781',
  border: '#eae6df',
}

export const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "'Hind Siliguri', 'Noto Sans Bengali', Arial, Helvetica, sans-serif",
}

export const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '28px 24px 36px',
}

export const heading = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: colors.black,
  margin: '0 0 16px',
}

export const text = {
  fontSize: '15px',
  color: colors.text,
  lineHeight: '1.7',
  margin: '0 0 18px',
}

export const link = { color: colors.goldDeep, textDecoration: 'underline' }

export const button = {
  backgroundColor: colors.black,
  color: '#F5D77A',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '10px',
  padding: '14px 26px',
  textDecoration: 'none',
  display: 'inline-block',
}

export const codeStyle = {
  fontSize: '30px',
  letterSpacing: '8px',
  fontWeight: 'bold' as const,
  color: colors.black,
  backgroundColor: '#faf6ec',
  border: `1px solid ${colors.border}`,
  borderRadius: '10px',
  padding: '16px 20px',
  textAlign: 'center' as const,
  margin: '0 0 22px',
}

const headerWrap = {
  borderBottom: `2px solid ${colors.gold}`,
  paddingBottom: '18px',
  marginBottom: '26px',
  textAlign: 'center' as const,
}

const brandText = {
  fontSize: '19px',
  fontWeight: 'bold' as const,
  letterSpacing: '3px',
  color: colors.goldDeep,
  margin: '10px 0 4px',
}

const taglineText = {
  fontSize: '10px',
  letterSpacing: '2px',
  color: colors.muted,
  margin: '0',
}

const footerText = {
  fontSize: '12px',
  color: colors.muted,
  lineHeight: '1.7',
  margin: '0 0 6px',
}

interface LayoutProps {
  preview: string
  children: React.ReactNode
}

export const EmailLayout = ({ preview, children }: LayoutProps) => (
  <Html lang="bn" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerWrap}>
          <Img
            src={LOGO_URL}
            width="56"
            height="56"
            alt={BRAND_NAME}
            style={{ margin: '0 auto', borderRadius: '12px' }}
          />
          <Text style={brandText}>{BRAND_NAME}</Text>
          <Text style={taglineText}>{BRAND_TAGLINE}</Text>
        </Section>

        {children}

        <Hr style={{ borderColor: colors.border, margin: '30px 0 18px' }} />
        <Text style={footerText}>
          কোনো সহায়তা প্রয়োজন হলে যোগাযোগ করুন{' '}
          <Link href={`mailto:${SUPPORT_EMAIL}`} style={link}>
            {SUPPORT_EMAIL}
          </Link>
        </Text>
        <Text style={footerText}>
          <Link href={BRAND_URL} style={link}>
            khijirion.com
          </Link>{' '}
          — উখিয়ার সব প্রয়োজনীয় সেবা, এক জায়গায়।
        </Text>
      </Container>
    </Body>
  </Html>
)
