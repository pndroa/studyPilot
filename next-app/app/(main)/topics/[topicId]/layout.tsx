'use client'

import TopicTabs from '@/components/Topics/TopicTabs'

export default function TopicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <TopicTabs>{children}</TopicTabs>
}
