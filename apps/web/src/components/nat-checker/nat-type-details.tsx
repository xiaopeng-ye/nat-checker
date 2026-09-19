import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { lookupMessage, lookupMessageList } from "@/lib/i18n"
import type { NATType } from "@workspace/nat-detection"
import { m } from "@/paraglide/messages.js"

/**
 * Tier-2 educational content for a NAT type (technical details, examples,
 * troubleshooting, comparison) as accordion items, so callers can merge them
 * into a larger Accordion (the result card adds an "advanced details" item).
 */
export function NatTypeDetailsItems({ natType }: { natType: NATType }) {
  const technicalDetails = lookupMessage(`natTypes_${natType}_technicalDetails`)
  const comparison = lookupMessage(`natTypes_${natType}_comparison`)
  const exampleScenarios = lookupMessageList(
    `natTypes_${natType}_exampleScenario`,
    8
  )
  const troubleshootingTips = lookupMessageList(
    `natTypes_${natType}_troubleshootingTip`,
    8
  )

  return (
    <>
      {technicalDetails && (
        <AccordionItem value="technical">
          <AccordionTrigger>{m.uiStrings_technicalDetails()}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            <p className="leading-relaxed">{technicalDetails}</p>
          </AccordionContent>
        </AccordionItem>
      )}

      {exampleScenarios.length > 0 && (
        <AccordionItem value="examples">
          <AccordionTrigger>{m.uiStrings_realWorldExamples()}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              {exampleScenarios.map((scenario) => (
                <li key={scenario}>{scenario}</li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      )}

      {troubleshootingTips.length > 0 && (
        <AccordionItem value="troubleshooting">
          <AccordionTrigger>
            {m.uiStrings_troubleshootingTips()}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            <ol className="list-decimal space-y-1.5 pl-5 leading-relaxed">
              {troubleshootingTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ol>
          </AccordionContent>
        </AccordionItem>
      )}

      {comparison && (
        <AccordionItem value="comparison">
          <AccordionTrigger>{m.uiStrings_comparison()}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            <p className="leading-relaxed">{comparison}</p>
          </AccordionContent>
        </AccordionItem>
      )}
    </>
  )
}

/** Standalone accordion variant used on the /nat-types page. */
export function NatTypeDetails({ natType }: { natType: NATType }) {
  return (
    <Accordion>
      <NatTypeDetailsItems natType={natType} />
    </Accordion>
  )
}
