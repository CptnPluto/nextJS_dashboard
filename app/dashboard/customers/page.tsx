import CustomersTable from "@/app/ui/customers/table"
import { fetchCustomers } from "@/app/lib/data"
import { fetchFilteredCustomers } from "@/app/lib/data"

export default async function Page() {
    const customers = await fetchCustomers();
    console.log("Customers: ", customers);
  return (
    <main>
        <CustomersTable customers={customers}/>
    </main>
  );
}
