export function FormFieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="mb-0 text-sm text-red-800" role="alert">
      {message}
    </p>
  );
}
