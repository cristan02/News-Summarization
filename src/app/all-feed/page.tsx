import FeedLayout from '@/components/FeedLayout'

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
