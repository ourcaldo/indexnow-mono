'use client';

/**
 * Accessible toggle switch with dark mode support.
 * Uses a real hidden checkbox for screen reader compatibility.
 */
export function ToggleSwitch({
  checked,
  onChange,
  testId,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  testId?: string;
}) {
  return (
    <label className="relative inline-flex cursor-pointer items-center shrink-0">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testId}
      />
      <div
        className={`h-[22px] w-10 rounded-full transition-colors duration-200 ${
          checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
        }`}
      >
        <div
          className={`mt-[2px] ml-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-[18px]' : 'translate-x-0'
          }`}
        />
      </div>
    </label>
  );
}
