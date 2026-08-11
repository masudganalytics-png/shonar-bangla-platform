import * as React from 'react'

import { Heading, Text } from '@react-email/components'

import { EmailLayout, codeStyle, heading, text } from './brand'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <EmailLayout preview="KHIJIRION — আপনার ভেরিফিকেশন কোড">
    <Heading style={heading}>পরিচয় নিশ্চিত করুন</Heading>
    <Text style={text}>নিচের কোডটি ব্যবহার করে আপনার পরিচয় নিশ্চিত করুন:</Text>
    <Text style={codeStyle}>{token}</Text>
    <Text style={{ ...text, margin: '0' }}>
      আপনি যদি এই কোড না চেয়ে থাকেন, তাহলে ইমেইলটি উপেক্ষা করুন।
    </Text>
  </EmailLayout>
)

export default ReauthenticationEmail
