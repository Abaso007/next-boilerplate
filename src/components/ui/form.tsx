"use client"

import { Input, InputProps, Tooltip } from "@nextui-org/react"
import { useState } from "react"
import { Controller, FieldPath, FieldValues, UseFormReturn } from "react-hook-form"
import { Icons } from "../icons"

export type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<InputProps, "form" | "name" | "tooltip" | "type"> & {
  form: UseFormReturn<TFieldValues>
  name: TName //? Required
  tooltip?: string
  type: InputProps["type"] | "password-eye-slash"
}

export default function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ form, name, tooltip, type, ...props }: FormFieldProps<TFieldValues, TName>) {
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => setIsVisible(!isVisible)

  const input = (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => (
        <Input
          {...field}
          {...props}
          type={type === "password-eye-slash" ? (isVisible ? "text" : "password") : type}
          isInvalid={!!form.formState.errors[name]}
          errorMessage={form.formState.errors[name]?.message?.toString()}
          endContent={
            props.endContent ||
            (type === "password-eye-slash" ? (
              <button
                className="focus:outline-none [&>svg]:focus:text-primary"
                type="button"
                onClick={toggleVisibility}
              >
                {isVisible ? (
                  <Icons.eyeSlash className="pointer-events-none text-2xl text-default-400" />
                ) : (
                  <Icons.eye className="pointer-events-none text-2xl text-default-400" />
                )}
              </button>
            ) : undefined)
          }
        />
      )}
    />
  )

  if (!tooltip) return input

  return (
    <Tooltip content={tooltip}>
      <div className="relative">{input}</div>
    </Tooltip>
  )
}
