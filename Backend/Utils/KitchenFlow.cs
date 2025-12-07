namespace Restaurant_Management.Utils
{
    public static class KitchenFlow
    {
        public static readonly List<string> Flow = new()
        {
            "Ordered",
            "Pending",
            "Cooking",
            "Ready",
            "Done"
        };
    }
}
