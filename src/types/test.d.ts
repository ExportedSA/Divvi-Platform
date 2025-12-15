// Type declarations for Jest test files
// This file provides TypeScript with the Jest global functions

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveClass(className: string): R
      toHaveStyle(style: Record<string, any>): R
      toBeVisible(): R
      toBeDisabled(): R
      toBeEnabled(): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveTextContent(text: string | RegExp): R
      toHaveValue(value: string | number): R
      toBeChecked(): R
      toHaveFocus(): R
      toBeEmptyDOMElement(): R
      toContainElement(element: HTMLElement | null): R
      toContainHTML(html: string): R
      toHaveDescription(text: string | RegExp): R
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R
      toHaveErrorMessage(text: string | RegExp): R
      toHaveFormValues(values: Record<string, any>): R
      toHaveRole(role: string): R
      toHaveAccessibleDescription(text: string | RegExp): R
      toHaveAccessibleName(text: string | RegExp): R
    }
  }
}

export {}
