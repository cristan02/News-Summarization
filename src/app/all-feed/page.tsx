import FeedLayout from '@/components/feed-layout'

export default function Page() {
  return (
    <FeedLayout
      type="all"
      title="All Articles"
      emptyMessage="No articles match your search criteria."
      showPreferencesLink={false}
    />
  )
}
