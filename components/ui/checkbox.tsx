"use client"

import * as React from "react"
import { Switch } from "@/components/ui/switch"

/**
 * Global migration: Alias Checkbox to Switch.
 * Any usage of <Checkbox /> will now render <Switch /> under the hood,
 * preserving checked/onCheckedChange and other common props.
 */

type CheckboxProps = React.ComponentPropsWithoutRef<typeof Switch>

const Checkbox = React.forwardRef<React.ElementRef<typeof Switch>, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return <Switch ref={ref} className={className} {...props} />
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
