import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabaseClient";
import { CATEGORIES, categoryLabel } from "../lib/categories";
import { confirmDialog } from "../lib/confirm";
import ListSkeleton from "../components/ListSkeleton";
import AdminTabs from "../components/AdminTabs";
import MechanicAssign from "../components/MechanicAssign";

const EMPTY = {
    shop_name: "",
    address: "",
    city: "",
    phone: "",
    service_categories: [],
    verified: true,
};

function Admin() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [values, setValues] = useState(EMPTY);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        let ignore = false;

        supabase
            .from("mechanic_shops")
            .select("*")
            .order("created_at", { ascending: false })
            .then(({ data, error }) => {
                if (ignore) return;
                if (error) setError(error.message);
                setShops(data ?? []);
                setLoading(false);
            });

        return () => {
            ignore = true;
        };
    }, []);

    function handleChange(e) {
        const { name, value } = e.target;
        setValues((current) => ({ ...current, [name]: value }));
    }

    function toggleCategory(value) {
        setValues((current) => ({
            ...current,
            service_categories: current.service_categories.includes(value)
                ? current.service_categories.filter((c) => c !== value)
                : [...current.service_categories, value],
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (values.service_categories.length === 0) {
            setError("Pick at least one service category.");
            return;
        }

        setError("");
        setIsSaving(true);

        const { data, error: saveError } = await supabase
            .from("mechanic_shops")
            .insert({
                shop_name: values.shop_name.trim(),
                address: values.address.trim(),
                city: values.city.trim() || null,
                phone: values.phone.trim() || null,
                service_categories: values.service_categories,
                verified: values.verified,
            })
            .select()
            .single();

        setIsSaving(false);

        if (saveError) {
            setError(saveError.message);
            return;
        }

        setShops((current) => [data, ...current]);
        setValues(EMPTY);
        setShowForm(false);
    }

    async function toggleVerified(shop) {
            if (shop.verified) {
      const ok = await confirmDialog({
        title: "Remove verification?",
        message: `${shop.shop_name} will disappear from the owners' shop list until you verify it again.`,
        confirmLabel: "Remove verification",
        danger: true,
      });

      if (!ok) return;
    }
        const { data, error: updateError } = await supabase
            .from("mechanic_shops")
            .update({ verified: !shop.verified })
            .eq("id", shop.id)
            .select()
            .single();

        if (updateError) {
            setError(updateError.message);
            return;
        }

        setShops((current) => current.map((s) => (s.id === shop.id ? data : s)));
    }

    async function handleDelete(shop) {
    const ok = await confirmDialog({
      title: "Delete this shop?",
      message: `${shop.shop_name} and its bookings will be removed. This can't be undone.`,
      confirmLabel: "Delete shop",
      danger: true,
    });

    if (!ok) return;

        const { error: deleteError } = await supabase
            .from("mechanic_shops")
            .delete()
            .eq("id", shop.id);

        if (deleteError) {
            setError(deleteError.message);
            return;
        }

        setShops((current) => current.filter((s) => s.id !== shop.id));
    }

    const pending = shops.filter((s) => !s.verified).length;

    return (
        <>
            <Navbar />

            <main className="page">
                        <AdminTabs />
                <div className="page-head">
                    <div>
                        <h1>Manage shops</h1>
                        <p>
                            {pending > 0
                                ? `${pending} shop${pending > 1 ? "s" : ""} waiting for verification.`
                                : "Add shops and decide which ones owners can see."}
                        </p>
                    </div>

                    {!showForm && (
                        <button
                            type="button"
                            className="primary-button"
                            onClick={() => setShowForm(true)}
                        >
                            Add shop
                        </button>
                    )}
                </div>

                {showForm && (
                    <form className="vehicle-form" onSubmit={handleSubmit}>
                        <h2>Add a shop</h2>

                        <div className="vehicle-form-grid">
                            <div>
                                <label htmlFor="shop_name">Shop name</label>
                                <input
                                    id="shop_name"
                                    name="shop_name"
                                    value={values.shop_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="phone">Phone</label>
                                <input
                                    id="phone"
                                    name="phone"
                                    value={values.phone}
                                    onChange={handleChange}
                                    placeholder="Optional"
                                />
                            </div>

                            <div>
                                <label htmlFor="address">Address</label>
                                <input
                                    id="address"
                                    name="address"
                                    value={values.address}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="city">City</label>
                                <input
                                    id="city"
                                    name="city"
                                    value={values.city}
                                    onChange={handleChange}
                                    placeholder="Davao City"
                                />
                            </div>
                        </div>

                        <label>Services offered</label>
                        <div className="check-grid">
                            {CATEGORIES.map((c) => (
                                <label key={c.value}>
                                    <input
                                        type="checkbox"
                                        checked={values.service_categories.includes(c.value)}
                                        onChange={() => toggleCategory(c.value)}
                                    />
                                    {c.label}
                                </label>
                            ))}
                        </div>

                        <div className="check-grid">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={values.verified}
                                    onChange={(e) =>
                                        setValues((current) => ({
                                            ...current,
                                            verified: e.target.checked,
                                        }))
                                    }
                                />
                                Verified (visible to owners)
                            </label>
                        </div>

                        {error && <p className="form-error">{error}</p>}

                        <div className="vehicle-form-actions">
                            <button
                                type="submit"
                                className="primary-button"
                                disabled={isSaving}
                            >
                                {isSaving ? "Saving..." : "Save shop"}
                            </button>

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => {
                                    setShowForm(false);
                                    setError("");
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {!showForm && error && <p className="form-error">{error}</p>}
                {loading && <ListSkeleton />}

                <div className="shop-list">
                    {shops.map((shop) => (
                        <article key={shop.id} className="shop-card">
                            <div className="shop-card-top">
                                <div>
                                    <h3>{shop.shop_name}</h3>
                                    <p>
                                        {[shop.address, shop.city].filter(Boolean).join(", ")}
                                        {shop.phone ? `, ${shop.phone}` : ""}
                                    </p>
                                </div>

                                <span
                                    className={`status-chip ${shop.verified ? "verified" : "pending"}`}
                                >
                                    {shop.verified ? "Verified" : "Pending"}
                                </span>
                            </div>

                            {shop.service_categories?.length > 0 && (
                                <ul className="tag-list">
                                    {shop.service_categories.map((c) => (
                                        <li key={c}>{categoryLabel(c)}</li>
                                    ))}
                                </ul>
                            )}

              <MechanicAssign shop={shop} />

              <div className="shop-card-links">
                                <button
                                    type="button"
                                    className="text-button"
                                    onClick={() => toggleVerified(shop)}
                                >
                                    {shop.verified ? "Remove verification" : "Verify shop"}
                                </button>

                                <button
                                    type="button"
                                    className="text-button danger"
                                    onClick={() => handleDelete(shop)}
                                >
                                    Delete
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </main>
        </>
    );
}

export default Admin;