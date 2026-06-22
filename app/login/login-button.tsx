'use client'

import { useFormStatus } from 'react-dom'

export function LoginButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 text-sm transition mt-1 cursor-pointer"
    >
      {pending ? 'Ingresando...' : 'Ingresar'}
    </button>
  )
}
