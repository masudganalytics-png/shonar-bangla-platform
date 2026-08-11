import * as React from 'react'

import { Button, Heading, Text } from '@react-email/components'

import { EmailLayout, button, heading, text } from './brand'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <EmailLayout preview="KHIJIRION — আপনাকে আমন্ত্রণ জানানো হয়েছে">
    <Heading style={heading}>আপনি আমন্ত্রিত</Heading>
    <Text style={text}>
      KHIJIRION-এ যোগ দেওয়ার জন্য আপনাকে আমন্ত্রণ জানানো হয়েছে। নিচের বাটনে ক্লিক করে
      আমন্ত্রণ গ্রহণ করুন এবং আপনার অ্যাকাউন্ট সক্রিয় করুন।
    </Text>
    <Button style={button} href={confirmationUrl}>
      আমন্ত্রণ গ্রহণ করুন
    </Button>
    <Text style={{ ...text, margin: '24px 0 0' }}>
      আপনি যদি এই আমন্ত্রণ প্রত্যাশা না করে থাকেন, তাহলে ইমেইলটি উপেক্ষা করুন।
    </Text>
  </EmailLayout>
)

export default InviteEmail
