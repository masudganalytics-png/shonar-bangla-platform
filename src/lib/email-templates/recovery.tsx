import * as React from 'react'

import { Button, Heading, Text } from '@react-email/components'

import { EmailLayout, button, heading, text } from './brand'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <EmailLayout preview="KHIJIRION — পাসওয়ার্ড রিসেট করুন">
    <Heading style={heading}>পাসওয়ার্ড রিসেট</Heading>
    <Text style={text}>
      আপনার KHIJIRION অ্যাকাউন্টের পাসওয়ার্ড রিসেট করার অনুরোধ পাওয়া গেছে। নিচের বাটনে
      ক্লিক করে নতুন পাসওয়ার্ড সেট করুন।
    </Text>
    <Button style={button} href={confirmationUrl}>
      নতুন পাসওয়ার্ড সেট করুন
    </Button>
    <Text style={{ ...text, margin: '24px 0 0' }}>
      আপনি যদি এই অনুরোধ না করে থাকেন, তাহলে কোনো পদক্ষেপ নেওয়ার প্রয়োজন নেই — আপনার
      পাসওয়ার্ড অপরিবর্তিত থাকবে।
    </Text>
  </EmailLayout>
)

export default RecoveryEmail
