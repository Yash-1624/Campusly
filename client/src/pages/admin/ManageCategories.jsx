import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import AdminStatsBoard from "../../components/AdminStatsBoard";
import AdminPageHero from "../../components/AdminPageHero";

const ManageCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [categoryName, setCategoryName] = useState("");
    const [creating, setCreating] = useState(false);

    // ========================================
    // LOAD CATEGORIES
    // ========================================

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/categories");

            console.log("CATEGORIES API RESPONSE:", response.data);

            /*
             * Support both:
             *
             * { categories: [...] }
             *
             * and
             *
             * { data: [...] }
             */

            const receivedCategories =
                response.data?.categories ||
                response.data?.data ||
                [];

            if (Array.isArray(receivedCategories)) {
                setCategories(receivedCategories.filter((category) => category && typeof category === "object"));
            } else {
                setCategories([]);
                setError("Invalid categories data received from server.");
            }

        } catch (err) {
            console.error(
                "FETCH CATEGORIES ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load categories."
            );

            setCategories([]);

        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchCategories();
    }, [fetchCategories]);

    const handleCreateCategory = async (event) => {
        event.preventDefault();
        const name = categoryName.trim();
        if (!name) {
            setError("Enter a category name first.");
            return;
        }

        setCreating(true);
        setError("");
        setSuccess("");
        try {
            const { data } = await api.post("/categories", { name });
            setCategories((previous) => {
                if (!data?.category || typeof data.category.name !== "string") return previous;
                const existingIndex = previous.findIndex((item) => item?.name?.toLowerCase() === data.category.name.toLowerCase());
                if (existingIndex < 0) return [...previous, data.category].sort((a, b) => a.name.localeCompare(b.name));
                return previous.map((item, index) => index === existingIndex ? data.category : item).sort((a, b) => a.name.localeCompare(b.name));
            });
            setCategoryName("");
            setSuccess(data.message || "Category created successfully.");
        } catch (err) {
            setError(err.response?.data?.message || "Could not create the category.");
        } finally {
            setCreating(false);
        }
    };


    // ========================================
    // ACTIVATE / DEACTIVATE
    // ========================================

    const handleToggleCategory = async (category) => {
        try {

            setUpdatingId(category._id);
            setError("");

            const endpoint =
                category.isActive
                    ? `/categories/${category._id}/deactivate`
                    : `/categories/${category._id}/activate`;

            await api.patch(endpoint);

            /*
             * Update only this category locally.
             * No need to reload the complete page.
             */

            setCategories((previousCategories) =>
                previousCategories.map((item) =>
                    item._id === category._id
                        ? {
                            ...item,
                            isActive: !item.isActive
                        }
                        : item
                )
            );

        } catch (err) {

            console.error(
                "UPDATE CATEGORY ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to update category."
            );

        } finally {

            setUpdatingId(null);

        }
    };


    // ========================================
    // LOADING
    // ========================================

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-content">

                    <h1>Categories</h1>

                    <div className="loading-message">
                        Loading categories...
                    </div>

                </div>
            </div>
        );
    }


    // ========================================
    // PAGE
    // ========================================

    return (
        <div className="admin-page">

            <div className="admin-content">

                <AdminPageHero eyebrow="EVENT ORGANIZATION" title="Categories" description="Create categories anytime and organize your campus events by type." />

                <AdminStatsBoard items={[
                    { label: "Total categories", value: categories.length, note: "Across your event library", icon: "?" },
                    { label: "Active", value: categories.filter((category) => category?.isActive).length, note: "Available for events", icon: "?" },
                    { label: "Inactive", value: categories.filter((category) => !category?.isActive).length, note: "Can be restored anytime", icon: "?" },
                ]} />

                <form className="category-create-panel" onSubmit={handleCreateCategory}>
                    <div className="category-create-icon" aria-hidden="true">?</div>
                    <div className="category-create-copy"><h2>Add a category</h2><p>Give your category a clear name, such as Technical, Cultural, or Sports.</p></div>
                    <label className="category-create-field"><span>Category name</span><input autoFocus maxLength={60} value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="e.g. Artificial Intelligence" required /></label>
                    <button type="submit" className="button primary" disabled={creating || !categoryName.trim()}>{creating ? "Creating..." : "Create Category"}</button>
                </form>


                {/* ========================================
                    ERROR
                ======================================== */}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {success && <div className="alert success category-create-success" role="status">{success}</div>}


                {/* ========================================
                    EMPTY STATE
                ======================================== */}

                {categories.length === 0 && !error && (

                    <div className="empty-state">

                        <h3>
                            No Categories Found
                        </h3>

                        <p>
                            Create your first category here, or it will
                            be added automatically when you create an event.
                        </p>

                    </div>

                )}


                {/* ========================================
                    CATEGORY LIST
                ======================================== */}

                {categories.length > 0 && (

                    <div className="categories-grid">

                        {categories.map((category) => (

                            <div
                                className="category-card"
                                key={category._id}
                            >

                                <div className="category-card-header">

                                    <h3>
                                        {category.name}
                                    </h3>

                                    <span
                                        className={
                                            category.isActive
                                                ? "category-status active"
                                                : "category-status inactive"
                                        }
                                    >
                                        {category.isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </span>

                                </div>


                                <div className="category-card-body">

                                    <p>Use this category to group related campus events.</p>

                                </div>


                                <div className="category-card-footer">

                                    <button
                                        type="button"
                                        className={
                                            category.isActive
                                                ? "button danger-button"
                                                : "button success-button"
                                        }
                                        onClick={() =>
                                            handleToggleCategory(
                                                category
                                            )
                                        }
                                        disabled={
                                            updatingId ===
                                            category._id
                                        }
                                    >

                                        {updatingId ===
                                            category._id
                                            ? "Updating..."
                                            : category.isActive
                                                ? "Deactivate"
                                                : "Activate"}

                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </div>
    );
};

export default ManageCategories;
