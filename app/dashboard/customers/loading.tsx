import { lusitana } from "@/app/ui/fonts";
import { CustomersTableSkeleton } from "../../ui/skeletons";
import Search from "@/app/ui/search";

export default function Loading() {
	return (
		<div className="w-full">
			<div className="flex w-full items-center justify-between">
				<h1 className={`${lusitana.className} mb-8 text-xl md:text-2xl`}>Customers</h1>
			</div>
			<Search placeholder="Search customers..." />
			<CustomersTableSkeleton />
		</div>
	);
}
