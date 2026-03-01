import React from "react";
import "./Help.css";

function Help() {
  return (
    <div className="help-page">
      {/* Header */}
      <div className="help-header">
        <div className="help-header-inner">
          <div className="help-header-text">
            <div className="help-guide-label">User Guide</div>
            <h1>Expiry Tracker</h1>
            <p>
              Everything you need to know to get the most out of the Expiry
              Tracker. What it's for, when to use it, and how to use it day to
              day.
            </p>
          </div>
        </div>
      </div>

      {/* Nav pills */}
      <nav className="help-nav">
        <a href="#what-is-it">What is it?</a>
        <a href="#when-to-use">When to use it</a>
        <a href="#getting-started">Getting started</a>
        <a href="#colours">Colour guide</a>
        <a href="#adding">Adding items</a>
        <a href="#editing">Editing items</a>
        <a href="#deleting">Deleting items</a>
      </nav>

      <main className="help-main">
        {/* 01 What is it */}
        <section id="what-is-it" className="help-section">
          <span className="help-section-number">01 · What is this?</span>
          <h2>What the Expiry Tracker is for</h2>
          <p>
            The Expiry Tracker is designed to help you manage long shelf-life
            products. Items that don't need checking every day and can easily
            slip through the cracks if you're not careful.
          </p>
          <div className="help-purpose-box">
            <p>
              Think of it as your safety net for the products thatsit quietly on
              the shelf for weeks or months at a time - FOH snacks, impulse
              items, ambient groceries - the things that are easy to forget
              until it's too late.
            </p>
          </div>
        </section>

        {/* 02 When to use */}
        <section id="when-to-use" className="help-section">
          <span className="help-section-number">02 · When to use it</span>
          <h2>Good fits vs. products to skip</h2>
          <p>
            The tracker works best for items you don't rotate through every day.
            For fast-moving or daily-checked products, it won't add much to your
            workflow.
          </p>
          <div className="help-examples-grid">
            <div className="help-example-card good">
              <div className="help-example-tag good-tag">✓ &nbsp;Add these</div>
              <ul>
                <li>FOH snacks &amp; impulse buys</li>
                <li>Ambient grocery lines</li>
                <li>Long shelf-life packaged goods</li>
                <li>Items checked weekly or less</li>
              </ul>
            </div>
            <div className="help-example-card skip">
              <div className="help-example-tag skip-tag">
                ✕ &nbsp;Skip these
              </div>
              <ul>
                <li>Mochis &amp; fresh desserts</li>
                <li>Daily-checked chilled items</li>

                <li>Products that sell out daily</li>
              </ul>
            </div>
          </div>
          <div className="help-tip">
            <span className="help-tip-icon">💡</span>
            <p>
              You know your shop best. If a product is already being checked and
              refilled daily or consistently sells before it expires, there's no
              need to track it here. Focus on adding the things that would
              otherwise be easy to miss.
            </p>
          </div>
        </section>

        {/* 03 The benefit */}
        <section className="help-section">
          <span className="help-section-number">03 · The benefit</span>
          <h2>How it saves you time</h2>
          <p>
            Once your long shelf-life products are in the tracker, you don't
            need to mentally keep tabs on all of them or physically check each
            one as often. The tracker surfaces what needs attention, so your
            team can stay focused and nothing gets missed.
          </p>
          <div className="help-card">
            <p>
              Start by adding the products that last a long time before
              expiring. Especially FOH snacks and impulse items - these are the
              products most likely to expire quietly without anyone noticing.
            </p>
          </div>
        </section>

        {/* 04 Getting Started */}
        <section id="getting-started" className="help-section">
          <span className="help-section-number">04 · Getting started</span>
          <h2>Logging in &amp; finding your way around</h2>
          <p>
            Getting set up takes less than a minute. Your admin will provide
            your login credentials. Once you're in, Start adding your products.
            Everything is organised by category to make it easier to manage.
          </p>
          <div className="help-login-steps">
            <div className="help-login-step">
              <div className="help-step-circle">1</div>
              <p>
                Log in with the username and password provided by your admin
              </p>
            </div>
            <div className="help-login-step">
              <div className="help-step-circle">2</div>
              <p>Your shop name appears at the top of the screen</p>
            </div>
            <div className="help-login-step">
              <div className="help-step-circle">3</div>
              <p>Add & view your inventory organised by product categories</p>
            </div>
          </div>
        </section>

        {/* 05 Colour Guide */}
        <section id="colours" className="help-section">
          <span className="help-section-number">05 · Colour guide</span>
          <h2>Understanding the colour coding</h2>
          <p>
            Items are colour-coded based on how close they are to expiry.
            Categories with the most urgent items automatically appear at the
            top, so the things that need attention are never buried.
          </p>

          <div className="help-colour-guide">
            <div className="help-colour-row">
              <div className="help-colour-swatch swatch-red"></div>
              <div className="help-colour-info">
                <strong>Red - Expiring in 1–5 days</strong>
                <span>High priority. Take action soon.</span>
              </div>
            </div>
            <div className="help-colour-row">
              <div className="help-colour-swatch swatch-yellow"></div>
              <div className="help-colour-info">
                <strong>Yellow - Expiring in 6–10 days</strong>
                <span>
                  Plan ahead. Start thinking about rotation or markdowns.
                </span>
              </div>
            </div>
            <div className="help-colour-row">
              <div className="help-colour-swatch swatch-white"></div>
              <div className="help-colour-info">
                <strong>White - More than 10 days</strong>
                <span>All clear. No action needed right now.</span>
              </div>
            </div>
          </div>

          <p className="help-subheading">Special status labels</p>

          <div className="help-status-table">
            <div className="help-status-header">
              <span>Label</span>
              <span>What it means</span>
            </div>
            <div className="help-status-row">
              <span className="help-status-badge badge-red">EXPIRED</span>
              <p>
                This product has passed its expiry date. Remove from shelves
                immediately.
              </p>
            </div>
            <div className="help-status-row">
              <span className="help-status-badge badge-red">
                EXPIRING TODAY
              </span>
              <p>
                This product expires today. Use it or remove it before end of
                day.
              </p>
            </div>
            <div className="help-status-row">
              <span className="help-status-badge badge-red">
                EXPIRING THIS WEEKEND
              </span>
              <p>
                Shown on Fridays only. The product expires Saturday or Sunday,
                take action before the weekend. Particularly useful for 5-day
                shops.
              </p>
            </div>
          </div>
        </section>

        {/* 06 Adding Items */}
        <section id="adding" className="help-section">
          <span className="help-section-number">06 · Adding items</span>
          <h2>Logging a product's expiry date</h2>
          <p>
            Tap the green <strong>+ Add Item</strong> button on your dashboard.
            You can search for a product by name or browse by category, then
            pick the expiry date from the calendar.
          </p>

          <ol className="help-steps">
            <li>
              <span className="help-step-num">1</span> Tap the green{" "}
              <strong>+ Add Item</strong> button
            </li>
            <li>
              <span className="help-step-num">2</span> Search for a product by
              name or browse by category
            </li>
            <li>
              <span className="help-step-num">3</span> Tap the product to select
              it - a green tick ✓ will appear
            </li>
            <li>
              <span className="help-step-num">4</span> Choose the expiry date
              from the calendar
            </li>
            <li>
              <span className="help-step-num">5</span> Tap <strong>Save</strong>
            </li>
          </ol>

          <div className="help-tip tip-green">
            <span className="help-tip-icon">✨</span>
            <p>
              After saving, the category will automatically expand and your new
              item will be highlighted so you can spot it straight away.
            </p>
          </div>
          <div className="help-tip tip-amber">
            <span className="help-tip-icon">⚠️</span>
            <p>
              You cannot add the same product with the same expiry date twice.
              This prevents duplicate entries from being created.
            </p>
          </div>
        </section>

        {/* 07 Editing Items */}
        <section id="editing" className="help-section">
          <span className="help-section-number">07 · Editing items</span>
          <h2>Updating an expiry date</h2>
          <p>
            If a date was entered incorrectly or a new batch has arrived with a
            different date, you can update it without deleting and re-adding the
            item.
          </p>
          <ol className="help-steps">
            <li>
              <span className="help-step-num">1</span> Find the item in your
              inventory
            </li>
            <li>
              <span className="help-step-num">2</span> Tap the{" "}
              <strong>⋮</strong> menu button on the right side of the item
            </li>
            <li>
              <span className="help-step-num">3</span> Select{" "}
              <strong>Edit Date</strong>
            </li>
            <li>
              <span className="help-step-num">4</span> Choose the new expiry
              date
            </li>
            <li>
              <span className="help-step-num">5</span> Tap <strong>Save</strong>
            </li>
          </ol>
        </section>

        {/* 08 Deleting Items */}
        <section id="deleting" className="help-section">
          <span className="help-section-number">08 · Deleting items</span>
          <h2>Removing an item from the tracker</h2>
          <p>
            Delete items when they've been sold, discarded, or are no longer
            being tracked. This keeps your inventory accurate and clutter-free.
          </p>
          <ol className="help-steps">
            <li>
              <span className="help-step-num">1</span> Find the item in your
              inventory
            </li>
            <li>
              <span className="help-step-num">2</span> Tap the{" "}
              <strong>⋮</strong> menu button on the right side of the item
            </li>
            <li>
              <span className="help-step-num">3</span> Select{" "}
              <strong>Delete</strong>
            </li>
            <li>
              <span className="help-step-num">4</span> Confirm the deletion
            </li>
          </ol>
          <div className="help-tip">
            <span className="help-tip-icon">💡</span>
            <p>
              Make a habit of deleting items as soon as they're sold or removed
              from the shelf. It keeps the tracker accurate and stops your team
              from acting on products that are already gone.
            </p>
          </div>
        </section>

        {/* Contact callout */}
        <div className="help-contact-callout">
          <span className="help-contact-icon">💬</span>
          <div>
            <h3>Can't find a product?</h3>
            <p>
              If a product you're looking for isn't in the list, contact your
              admin, they can add it for you. Don't skip tracking it in the
              meantime; just let them know.
            </p>
          </div>
        </div>

        <div className="help-footer">Expiry Tracker · Staff User Guide</div>
      </main>
    </div>
  );
}

export default Help;
