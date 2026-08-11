import * as React from 'react'

import { Button, Heading, Text } from '@react-email/components'

import { EmailLayout, button, heading, text } from './brand'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <EmailLayout preview="KHIJIRION — আপনার লগইন লিংক">
    <Heading style={heading}>লগইন লিংক</Heading>
    <Text style={text}>
      নিচের বাটনে ক্লিক করে KHIJIRION-এ লগইন করুন। লিংকটি সীমিত সময়ের জন্য কার্যকর।
    </Text>
    <Button style={button} href={confirmationUrl}>
      লগইন করুন
    </Button>
    <Text style={{ ...text, margin: '24px 0 0' }}>
      আপনি যদি এই লিংক না চেয়ে থাকেন, তাহলে ইমেইলটি উপেক্ষা করুন।
    </Text>
  </EmailLayout>
)

export default MagicLinkEmail
