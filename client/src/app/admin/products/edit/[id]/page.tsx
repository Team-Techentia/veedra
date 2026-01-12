"use client";

import React from "react";
import { useParams } from "next/navigation";
import { EditProductForm } from "../../_components/EditProductForm";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="max-w-6xl mx-auto py-10">
      <EditProductForm productId={params?.id ?? ""} />
    </div>
  );
}
