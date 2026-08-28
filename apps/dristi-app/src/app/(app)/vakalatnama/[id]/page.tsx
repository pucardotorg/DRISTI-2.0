"use client";

import * as React from "react";

import { VakalatnamaWizard } from "@/components/vakalatnama/wizard";

export default function VakalatnamaDraftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  return <VakalatnamaWizard id={id} />;
}
