"use client";

export function Header() {
  return (
    <header className="bg-[#efefef] border-b border-gray-200 py-4 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1 flex justify-start">
          <div className="h-10 flex items-center">
            <img
              src="/images/btire-logo.png"
              alt="BTire"
              className="h-10 w-auto object-contain"
            />
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="h-12 flex items-center">
            <img
              src="/images/bridgestone-altalayi.png"
              alt="Bridgestone Altalayi"
              className="h-12 w-auto object-contain"
            />
          </div>
        </div>

        <div className="flex-1 flex justify-end">
          <button
            type="button"
            className="text-gray-700 font-semibold hover:text-black transition-colors text-sm cursor-pointer"
          >
            Arabic
          </button>
        </div>
      </div>
    </header>
  );
}

