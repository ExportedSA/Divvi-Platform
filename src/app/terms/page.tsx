import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function TermsPage() {
  const page = await prisma.staticPage.findUnique({
    where: { slug: 'terms' },
  })

  if (!page) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Terms of Use</h1>
        <p>Content not found.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="prose prose-neutral max-w-none p-8">
          <div dangerouslySetInnerHTML={{ __html: page.content.replace(/\n/g, '<br />') }} />
        </CardContent>
      </Card>
    </div>
  )
}
