import ArrowRight02Icon from "@hugeicons/core-free-icons/ArrowRight02Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { Badge } from "@workspace/ui/components/badge"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"
import {
  IMPACT_APPLICATIONS,
  ImpactRatingLabel,
} from "@/components/nat-checker/nat-impact-grid"
import { BlurFade } from "@/components/magicui/blur-fade"
import { PageBackground } from "@/components/layout/page-background"
import { NatTypeCard } from "@/components/nat-checker/nat-type-card"
import { lookupMessage } from "@/lib/i18n"
import { NAT_TYPE_IMPACT } from "@/lib/nat-impact"
import {
  DETECTABLE_NAT_TYPES,
  FILTERING_SUBTYPES,
  NAT_TYPE_META,
  TONE_TEXT_CLASS,
} from "@/lib/nat-type-meta"
import { buildPageHead } from "@/lib/seo"
import { m } from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

export const Route = createFileRoute("/nat-types")({
  head: () =>
    buildPageHead({
      path: `/${getLocale()}/nat-types`,
      title: m.uiStrings_natTypesTitle(),
      description: m.uiStrings_otherNATTypesDescription(),
    }),
  component: NatTypesPage,
})

const ALL_TYPES = [...DETECTABLE_NAT_TYPES, ...FILTERING_SUBTYPES]

function SectionHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h2>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        {description}
      </p>
    </div>
  )
}

function NoteProperty({
  term,
  badge,
  badgeVariant,
  children,
}: {
  term: string
  badge: string
  badgeVariant: "secondary" | "outline"
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <dt className="flex flex-wrap items-center gap-2 font-medium">
        {term}
        <Badge variant={badgeVariant}>{badge}</Badge>
      </dt>
      <dd className="leading-relaxed text-muted-foreground">{children}</dd>
    </div>
  )
}

function NatTypesPage() {
  return (
    <>
      <PageBackground variant="glow" />
      <div className="container mx-auto max-w-5xl space-y-14 px-4 py-12 sm:py-16">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {m.uiStrings_natTypesTitle()}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            {m.uiStrings_otherNATTypesDescription()}
          </p>
          <div className="max-w-3xl space-y-3 rounded-lg border bg-card p-4 text-sm">
            <p className="text-muted-foreground">
              {m.uiStrings_natTypesNote_intro()}
            </p>
            <dl className="space-y-3">
              <NoteProperty
                term={m.uiStrings_natTypesNote_mappingTerm()}
                badge={m.uiStrings_badgeDetectable()}
                badgeVariant="secondary"
              >
                {m.uiStrings_natTypesNote_mappingDescription()}
              </NoteProperty>
              <NoteProperty
                term={m.uiStrings_natTypesNote_filteringTerm()}
                badge={m.uiStrings_badgeEducational()}
                badgeVariant="outline"
              >
                {m.uiStrings_natTypesNote_filteringDescription()}
              </NoteProperty>
            </dl>
          </div>
        </header>

        <section className="space-y-6" aria-labelledby="detectable-heading">
          <SectionHeading
            title={m.uiStrings_detectableSection()}
            description={m.uiStrings_detectableSectionDescription()}
          />
          <div className="grid items-start gap-4 md:grid-cols-2">
            {DETECTABLE_NAT_TYPES.map((type, i) => (
              <BlurFade key={type} inView delay={i * 0.08}>
                <NatTypeCard natType={type} />
              </BlurFade>
            ))}
          </div>
        </section>

        <section className="space-y-6" aria-labelledby="filtering-heading">
          <SectionHeading
            title={m.uiStrings_filteringSection()}
            description={m.uiStrings_filteringSectionDescription()}
          />
          {/* Two columns: at this container width a third column squeezes the
            definitions into seven-line paragraphs. */}
          <div className="grid items-start gap-4 md:grid-cols-2">
            {FILTERING_SUBTYPES.map((type, i) => (
              <BlurFade key={type} inView delay={i * 0.08}>
                <NatTypeCard natType={type} />
              </BlurFade>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {m.uiStrings_atAGlance()}
          </h2>
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{m.uiStrings_natTypeColumn()}</TableHead>
                  {IMPACT_APPLICATIONS.map((app) => (
                    <TableHead key={app.key}>
                      <span className="flex items-center gap-1.5">
                        <HugeiconsIcon
                          icon={app.icon}
                          className="size-4"
                          aria-hidden="true"
                        />
                        {app.label()}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALL_TYPES.map((type) => {
                  const impact = NAT_TYPE_IMPACT[type]
                  const meta = NAT_TYPE_META[type]
                  if (!impact) return null
                  return (
                    <TableRow key={type}>
                      <TableCell className="font-medium">
                        <a
                          href={`#${type}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <HugeiconsIcon
                            icon={meta.icon}
                            className={cn("size-4", TONE_TEXT_CLASS[meta.tone])}
                            aria-hidden="true"
                          />
                          {lookupMessage(`natTypes_${type}_name`) ?? type}
                        </a>
                      </TableCell>
                      {IMPACT_APPLICATIONS.map((app) => (
                        <TableCell key={app.key}>
                          <ImpactRatingLabel rating={impact[app.key]} />
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </section>

        <div className="flex justify-center">
          <Link to="/" className={buttonVariants({ size: "lg" })}>
            {m.uiStrings_checkYourNAT()}
            <HugeiconsIcon icon={ArrowRight02Icon} data-icon="inline-end" />
          </Link>
        </div>
      </div>
    </>
  )
}
