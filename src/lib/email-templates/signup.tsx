import * as React from 'react'

import { Button, Heading, Link, Text } from '@react-email/components'

import { EmailLayout, button, heading, link, text } from './brand'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ recipient, confirmationUrl }: SignupEmailProps) => (
  <EmailLayout preview="KHIJIRION — আপনার ইমেইল নিশ্চিত করুন">
    <Heading style={heading}>ইমেইল নিশ্চিত করুন</Heading>
    <Text style={text}>
      KHIJIRION-এ নিবন্ধন করার জন্য ধন্যবাদ। নিচের বাটনে ক্লিক করে আপনার ইমেইল ঠিকানা (
      <Link href={`mailto:${recipient}`} style={link}>
        {recipient}
      </Link>
      ) নিশ্চিত করুন।
    </Text>
    <Button style={button} href={confirmationUrl}>
      ইমেইল নিশ্চিত করুন
    </Button>
    <Text style={{ ...text, margin: '24px 0 0' }}>
      আপনি যদি এই অ্যাকাউন্ট তৈরি না করে থাকেন, তাহলে এই ইমেইলটি উপেক্ষা করতে পারেন।
    </Text>
  </EmailLayout>
)

export default SignupEmail
