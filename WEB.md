# React web — login, insert data, view data

Step-by-step guide to build a **new React website** for this Flutter app.

The website talks to the **same Supabase project** as the phone app. Login, insert, and view all use that database. Do not put this React app inside the Flutter project. Create it in a **new folder**.

---

## Step 1 — Install Node.js

Install the LTS version from [https://nodejs.org](https://nodejs.org).

Check in PowerShell:

```powershell
node -v
npm -v
```

You need Node 18 or newer.

---

## Step 2 — Create a React project

Open PowerShell. Create the site **next to** this Flutter folder, not inside `lib/` or `web/`.

```powershell
cd "d:\kzw\New folder"
npm create vite@latest data-mgmt-web -- --template react
cd data-mgmt-web
npm install
npm install @supabase/supabase-js react-router-dom
```

Start it later with:

```powershell
npm run dev
```

The local URL is usually `http://localhost:5173`.

---

## Step 3 — Connect React to Supabase

Create `src/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'PASTE_PROJECT_URL_HERE',
  'PASTE_ANON_OR_PUBLISHABLE_KEY_HERE',
)
```

In the [Supabase dashboard](https://supabase.com/dashboard):

1. Open this same project the phone app uses
2. **Project Settings → API**
3. Copy **Project URL** into `PASTE_PROJECT_URL_HERE`
4. Copy **anon public** (or publishable key) into `PASTE_ANON_OR_PUBLISHABLE_KEY_HERE`

Do not copy the service role key.

Then in **Authentication → URL Configuration** add:

- `http://localhost:5173`
- your live domain later

---

## Step 4 — Login page

Create `src/pages/Login.jsx`.

Use email + password (same accounts as the phone app):

```js
const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
```

Optional register page:

```js
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { display_name: name } },
})
```

Keep the session:

```js
const { data } = await supabase.auth.getSession()
supabase.auth.onAuthStateChange((_event, session) => {
  // save session; if null, send user to /login
})
```

Sign out:

```js
await supabase.auth.signOut()
```

Password must be at least 8 characters (same rule as the Flutter app).

If the user is not logged in, send them to `/login`. If they are logged in, send them to `/properties`.

---

## Step 5 — View inserted data (property list)

Table: `properties`

RLS only returns rows for the logged-in user.

```js
const { data, error } = await supabase
  .from('properties')
  .select('*')
  .eq('status', 'available')
  .order('created_at', { ascending: false })
```

Show each row:

- title (or `property_code` if title is empty)
- township / ward
- `price_lakhs`
- `offer_type` (`sale` / `rent`)
- `status`

Click a card → detail page.

Load one property:

```js
const { data } = await supabase
  .from('properties')
  .select('*')
  .eq('id', propertyId)
  .single()
```

Phone numbers are not on `properties`. They live on `contacts` + `property_contacts`:

```js
const { data } = await supabase
  .from('property_contacts')
  .select('contacts(phones)')
  .eq('property_id', propertyId)
```

Photos are in `property_media` (private bucket `property-media`):

```js
const { data: media } = await supabase
  .from('property_media')
  .select('*')
  .eq('property_id', propertyId)
  .order('sort_order')

const { data: signed } = await supabase.storage
  .from('property-media')
  .createSignedUrl(media[0].storage_path, 3600)
```

Mandalay dropdowns:

```js
await supabase.from('mandalay_townships').select('id, name_mm, name_en').order('id')
await supabase.from('mandalay_wards').select('id, township_id, name_mm').eq('township_id', townshipId)
```

---

## Step 6 — Insert data (new property)

Create a form page `/properties/new`.

On Save, insert into `properties`. You must set `user_id` to the current user:

```js
const { data: { user } } = await supabase.auth.getUser()

const { data, error } = await supabase
  .from('properties')
  .insert({
    user_id: user.id,
    title,
    property_code,
    price_lakhs,
    price_type,      // 'negotiable' | 'exact'
    offer_type,      // 'sale' | 'rent'
    city,
    township,        // Myanmar name from dropdown
    ward,
    township_id,
    ward_id,
    address,
    land_width,
    land_length,
    land_unit: 'ft',
    floors,
    bedrooms,
    master_bedrooms,
    bathrooms,
    direction,
    aircon_count,
    has_solar,
    solar_panels,
    battery_capacity,
    amenities,       // string array
    deal_type,       // 'direct' | 'agent' | 'other'
    status: 'available',
    original_text,
  })
  .select()
  .single()
```

Suggested form fields (same as the phone app):

- Title, property code, phone
- Price (lakhs), price type, sale/rent
- Property type, structure type, city
- Township, ward, address
- Land width / length, floors, bedrooms, master bedrooms, bathrooms
- Direction, aircon, solar, amenities
- Status, deal type, original ad text
- Photos

### Save phone

After the property insert:

1. Insert `contacts` with `user_id`, `name`, `contact_type: 'owner'`, `phones: ['09...']`
2. Insert `property_contacts` with `user_id`, `property_id`, `contact_id`, `role: 'owner'`

### Save photos

```js
const path = `${user.id}/${property.id}/images/${crypto.randomUUID()}.jpg`

await supabase.storage.from('property-media').upload(path, file)

await supabase.from('property_media').insert({
  user_id: user.id,
  property_id: property.id,
  storage_path: path,
  media_type: 'image',
  sort_order: 0,
  file_name: file.name,
  file_size: file.size,
  mime_type: file.type,
})
```

Then open the new row: `/properties/{id}`.

---

## Step 7 — Pages to build

| Route | Screen |
|---|---|
| `/login` | Email + password |
| `/register` | Create account |
| `/properties` | List + search |
| `/properties/new` | Insert form |
| `/properties/:id` | View detail |
| `/properties/:id/edit` | Edit + save |

Use `react-router-dom` for these routes.

---

## Step 8 — Run and test

```powershell
cd "d:\kzw\New folder\data-mgmt-web"
npm run dev
```

1. Open `http://localhost:5173`
2. Sign in with the **same email/password** as the Android app
3. Add a property and save
4. You should see it on the list and on the phone app after refresh

---

## Step 9 — Production build

```powershell
npm run build
```

Upload the `dist/` folder to Netlify, Cloudflare Pages, or Firebase Hosting.

Add the live URL in Supabase **Authentication → URL Configuration**.

---

## Tables this site uses

| Table | Use |
|---|---|
| `auth.users` / `profiles` | Login (profile is created by a trigger on signup) |
| `properties` | Insert and view listings |
| `contacts` + `property_contacts` | Phone numbers |
| `property_media` + storage `property-media` | Photos / videos |
| `mandalay_townships` + `mandalay_wards` | Location dropdowns |

A logged-in user can only read and write **their own** rows (RLS).
