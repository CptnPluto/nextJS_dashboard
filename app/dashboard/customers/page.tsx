import { Metadata } from "next";
import { Suspense } from "react";
import CustomersTable from "@/app/ui/customers/table";
import Search from "@/app/ui/search";
import { CustomersTableSkeleton } from "@/app/ui/skeletons";
import { lusitana } from "@/app/ui/fonts";

export const metadata: Metadata = {
	title: "Customers",
};

export default async function Page({
	searchParams,
}: {
	searchParams?: Promise<{ query?: string; page?: string }>;
}) {
	const params = await searchParams;
	const query = params?.query || "";

	return (
		<div className="w-full">
			<div className="flex w-full items-center justify-between">
				<h1 className={`${lusitana.className} text-2xl`}>Customers</h1>
			</div>
			<div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
				<Search placeholder="Search invoices..." />
			</div>
			<Suspense fallback={<CustomersTableSkeleton />}>
				<CustomersTable query={query} />
			</Suspense>
		</div>
	);
}

