# SQM staff guide — adding cars to the website

You do this in the Sanity Studio (the "Serene Quality Motors" studio). Everything below is done with buttons and forms — no code.

## Add a car

1. Open the studio and click **Vehicles**, then the **+** (pencil-plus) button. A blank vehicle form opens.
2. Fill in the details from top to bottom. Fields marked with **\*** are needed before the car can go live (the form tells you what's missing when you try to publish).
3. The **slug** field: click **Generate** after entering year/make/model — it creates the web address.
4. Answer every question in **Vehicle disclosures** at the bottom. Ontario law (OMVIC) requires this, and the site will not publish the car until each one is answered.
5. Click **Publish**. The car appears on the website within a few minutes.

## Photos

1. In the **Photos** section, click **+** and upload your photos (or drag them in).
2. Write **alt text** for every photo — one line describing it, e.g. "Front three-quarter view from the driver side". The form insists on this.
3. Set **Exterior** or **Interior** on each photo. The website splits the gallery into these two tabs.
4. **Reorder** by dragging photos — the **first photo is the cover** shown on the inventory page, so keep the front three-quarter shot first.
5. Click **Publish** to make changes live.

## Set a price reduction correctly

1. Lower the **All-in price** to the new price.
2. Move the **old price** into **Previous price** (it must be higher than the new price).
3. Tick **"This previous price was genuinely advertised"** — only if that old price was really advertised (flyer, AutoTrader, etc.). This is an OMVIC rule; the site shows the old price struck through only when ticked.
4. Click **Publish**. A "Price reduced" badge appears on the car.

## Mark a car as sold

Open the car and click the **Mark as sold** button at the top of the form. Confirm the dialog. It sets the status to Sold and the date sold to today, and publishes in one step. The car moves to "Recently sold" on the website on the next update, and its page stays up for 30 days. Made a mistake? Click **Mark as available** to reverse it.

## Fix a mistake

Everything is editable. Open the car, change the field, click **Publish**. If a change was published that shouldn't have been, correct it and publish again. To remove a car from the site entirely, open it and use the **…** (ellipsis) menu → **Delete** (or set the status to Sold if it just needs to leave the "available" list).

## Photo import from a folder (for big batches)

If the owner sends a folder of photos, each car's photos go in a subfolder named by the car's **stock number or VIN**, like:

```
photos/
  S-1001/
    01-front.jpg
    02-rear.jpg
    03-dash-interior.jpg
  S-1002/
    ...
```

- File names sort alphabetically and are added to the car in that order — name them `01-…`, `02-…` to control the order.
- Any file name containing **"interior"** is filed as an Interior photo; everything else is Exterior.
- The import saves everything as **drafts** — you still review and publish in the Studio.

Ask the site maintainer to run the import script, or see `studio/README.md` for the exact command.
