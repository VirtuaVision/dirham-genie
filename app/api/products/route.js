export async function GET(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const isListView = params.get("fields") === "list";
  const limit = parseInt(params.get("limit") || "0", 10); // 0 = no pagination, existing behavior
  const page = Math.max(1, parseInt(params.get("page") || "1", 10));
  const search = params.get("search");
  const source = params.get("source"); // "amazon_api" | "manual" | null
  const dateFrom = params.get("dateFrom"); // "YYYY-MM-DD"
  const dateTo = params.get("dateTo"); // "YYYY-MM-DD"
  const idsOnly = params.get("idsOnly") === "true";

  let query = supabaseAdmin
    .from("products")
    .select(
      idsOnly
        ? "id"
        : isListView
        ? "id, title, slug, image_url, price, list_price, source, is_active, is_featured, categories(name, slug)"
        : "*, categories(name, slug)",
      limit ? { count: "exact" } : undefined
    )
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("title", `%${search}%`);
  if (source === "amazon_api") query = query.eq("source", "amazon_api");
  if (source === "manual") query = query.neq("source", "amazon_api");
  if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
  if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);

  if (limit) {
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);
  }

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    products: data,
    total: limit ? count : data.length,
    page,
    totalPages: limit ? Math.max(1, Math.ceil(count / limit)) : 1,
  });
}