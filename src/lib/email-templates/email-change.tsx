import * as React from 'react'

import { Button, Heading, Link, Text } from '@react-email/components'

import { EmailLayout, button, heading, link, text } from './brand'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  oldEmail,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <EmailLayout preview="KHIJIRION — নতুন ইমেইল ঠিকানা নিশ্চিত করুন">
    <Heading style={heading}>নতুন ইমেইল নিশ্চিত করুন</Heading>
    <Text style={text}>
      আপনার KHIJIRION অ্যাকাউন্টের ইমেইল ঠিকানা{' '}
      <Link href={`mailto:${oldEmail || email}`} style={link}>
        {oldEmail || email}
      </Link>{' '}
      থেকে{' '}
      <Link href={`mailto:${newEmail}`} style={link}>
        {newEmail}
      </Link>{' '}
      -এ পরিবর্তনের অনুরোধ করা হয়েছে। নিশ্চিত করতে নিচের বাটনে ক্লিক করুন।
    </Text>
    <Button style={button} href={confirmationUrl}>
      পরিবর্তন নিশ্চিত করুন
    </Button>
    <Text style={{ ...text, margin: '24px 0 0' }}>
      আপনি যদি এই পরিবর্তন না চেয়ে থাকেন, তাহলে ইমেইলটি উপেক্ষা করুন।
    </Text>
  </EmailLayout>
)

export default EmailChangeEmail
