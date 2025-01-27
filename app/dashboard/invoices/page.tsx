export default async function Invoices() {
	const timeout = await new Promise((resolve) => {
		setTimeout(() => {
			resolve("done");
		}, 400);
	});

	return <div>Invoices</div>;
}
