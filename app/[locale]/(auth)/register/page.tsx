import { RegisterComponent } from "./components/RegisterComponent";

const RegisterPage = async () => {
  return (
    <div className="flex flex-col w-full h-full overflow-auto p-10 space-y-5">
      <div className="py-2 flex items-center justify-center gap-3">
        <h1 className="scroll-m-20 text-3xl sm:text-4xl font-extrabold tracking-tight">Welcome to</h1>
        <img src="/logo.png" alt="Ledger1CRM logo" className="h-10 sm:h-12 w-auto" />
      </div>
      <RegisterComponent />
    </div>
  );
};

export default RegisterPage;
