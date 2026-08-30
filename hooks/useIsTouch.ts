"use client";

import { useEffect, useState } from "react";
import { isTouchDevice } from "@/lib/utils";

export function useIsTouch(): boolean {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    setTouch(isTouchDevice());
  }, []);
  return touch;
}
