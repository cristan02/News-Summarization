import FeedLayout from '@/components/feed-layout'

export default function Page() {
  return (
    <FeedLayout
      type="personalized"
      title="Your Feed"
      emptyMessage="No articles match your search criteria."
      showPreferencesLink={true}
    />
  )
}
