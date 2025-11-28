import {
  GlobeIcon,
  LayersIcon,
  LockIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ZapIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { NATType } from "@/lib/nat-detection/types";
import { cn } from "@/lib/utils";

export default async function NatTypesPage() {
  const t = await getTranslations("UIStrings");
  const tNat = await getTranslations("NATTypes");

  const features = [
    {
      Icon: ZapIcon,
      name: tNat("NO_NAT.name"),
      description: tNat("NO_NAT.definition"),
      href: "",
      cta: t("learnMore"),
      background: <div className="absolute -right-20 -top-20 opacity-60" />,
      className: "lg:row-start-1 lg:col-start-1 lg:col-span-1",
      type: NATType.NO_NAT,
      iconClassName: "text-emerald-500",
    },
    {
      Icon: GlobeIcon,
      name: tNat("FULL_CONE.name"),
      description: tNat("FULL_CONE.definition"),
      href: "https://en.wikipedia.org/wiki/Network_address_translation#Full-cone_NAT",
      cta: t("learnMore"),
      background: <div className="absolute -right-20 -top-20 opacity-60" />,
      className: "lg:row-start-1 lg:col-start-2 lg:col-span-2",
      type: NATType.FULL_CONE,
      iconClassName: "text-green-500",
    },
    {
      Icon: ShieldCheckIcon,
      name: tNat("RESTRICTED_CONE.name"),
      description: tNat("RESTRICTED_CONE.definition"),
      href: "https://en.wikipedia.org/wiki/Network_address_translation#Restricted-cone_NAT",
      cta: t("learnMore"),
      background: <div className="absolute -right-20 -top-20 opacity-60" />,
      className: "lg:row-start-2 lg:col-start-1 lg:col-span-2",
      type: NATType.RESTRICTED_CONE,
      iconClassName: "text-blue-500",
    },
    {
      Icon: ShieldAlertIcon,
      name: tNat("PORT_RESTRICTED_CONE.name"),
      description: tNat("PORT_RESTRICTED_CONE.definition"),
      href: "https://en.wikipedia.org/wiki/Network_address_translation#Port-restricted_cone_NAT",
      cta: t("learnMore"),
      background: <div className="absolute -right-20 -top-20 opacity-60" />,
      className: "lg:row-start-2 lg:col-start-3 lg:col-span-1",
      type: NATType.PORT_RESTRICTED_CONE,
      iconClassName: "text-yellow-500",
    },
    {
      Icon: LockIcon,
      name: tNat("SYMMETRIC.name"),
      description: tNat("SYMMETRIC.definition"),
      href: "https://en.wikipedia.org/wiki/Network_address_translation#Symmetric_NAT",
      cta: t("learnMore"),
      background: <div className="absolute -right-20 -top-20 opacity-60" />,
      className: "lg:row-start-3 lg:col-start-1 lg:col-span-1",
      type: NATType.SYMMETRIC,
      iconClassName: "text-red-500",
    },
    {
      Icon: LayersIcon,
      name: tNat("MULTIPLE_LAYERS.name"),
      description: tNat("MULTIPLE_LAYERS.definition"),
      href: "",
      cta: t("learnMore"),
      background: <div className="absolute -right-20 -top-20 opacity-60" />,
      className: "lg:row-start-3 lg:col-start-2 lg:col-span-2",
      type: NATType.MULTIPLE_LAYERS,
      iconClassName: "text-orange-500",
    },
  ];

  return (
    <div className="relative min-h-screen bg-background overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      <DotPattern
        className={cn(
          "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
        )}
      />

      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 dark:from-neutral-100 dark:to-neutral-500">
            {t("otherNATTypes")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("otherNATTypesDescription")}
          </p>
        </div>

        <BentoGrid className="lg:grid-rows-3">
          {features.map((feature) => (
            <BentoCard key={feature.name} {...feature} />
          ))}
        </BentoGrid>
      </div>
    </div>
  );
}
