
// Import Dependencies
require('dotenv').config(); // To access environment variables
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const multer = require('multer'); // Make sure to import multer first
const bcrypt = require("bcrypt");
const User = require("./models/User");
const Record = require('./models/Record');
const Business = require('./models/TempBusiness'); // Business model
const slugify = require("slugify");
const Calendar = require('./models/Calendar');
const Category = require('./models/Category');
const Service = require('./models/Service');
const Client = require("./models/Client"); 
const Appointment = require("./models/Appointment");
const WeeklyAvailability = require("./models/WeeklyAvailability");
const UpcomingHours = require("./models/UpcomingHours");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);




const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const crypto = require("crypto");

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public', 'uploads'));  // Save to 'public/uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
  }
});

const upload = multer({ storage: storage }); // Initialize multer here, before any routes

// Create Express App
const app = express();
 app.set('views', path.join(__dirname, 'views')); 
app.set('view engine', 'ejs');

const router = express.Router();
  const MongoStore = require("connect-mongo");


 
// ------------------- Middleware Setup (place this BEFORE routes) -------------------
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }), // ✅ persists sessions
  cookie: {
    secure: false, // true if using HTTPS in production
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));


// Middleware to serve static files (like CSS and JS)

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "views")));
app.use("/templates", express.static(path.join(__dirname, "templates")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// MongoDB Connection
const mongoURI = process.env.MONGO_URI; // Mongo URI from the .env file

if (!mongoURI) {
    console.error('MongoDB URI not found in environment variables.');
    process.exit(1); // Exit if the Mongo URI is not set
}

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

//User Authentication 
    function ensureAuthenticated(req, res, next) {
      if (req.session.userId) {
        next(); // User is logged in, move to the next middleware/route
      } else {
        res.redirect('/signup'); // Or send a 401 if it's an API
      }
    }
    app.get('/session-info', (req, res) => {
      if (req.session.userId) {
        res.json({ loggedIn: true, userId: req.session.userId });
      } else {
        res.json({ loggedIn: false });
      }
    });


    //Stripe 
   app.post("/create-payment-intent", async (req, res) => {
  const { amount, businessName } = req.body;

  try {
    // Limit the descriptor to 22 characters max
    let descriptor = `${businessName} AT SUITESEAT`.toUpperCase();
    if (descriptor.length > 22) {
      descriptor = descriptor.slice(0, 22);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      description: "Suiteseat App Booking Fee",
     statement_descriptor_suffix: descriptor,

    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error("❌ Stripe Payment Error:", err);
    res.status(500).json({ message: "Payment failed" });
  }
});




//User
app.put("/update-user-profile", upload.single("profilePhoto"), async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: "Not logged in" });

  try {
    const updates = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
    };

    if (req.file) {
      updates.profilePhoto = "/uploads/" + req.file.filename;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
    res.status(200).json({ message: "Profile updated", user: updatedUser });
  } catch (err) {
    console.error("❌ Failed to update profile:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.get("/get-current-user", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: "Not logged in" });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Failed to fetch user info:", err);
    res.status(500).json({ message: "Server error" });
  }
});





// Route to create a new business (with file upload)
app.post("/create-service", upload.single("image"), async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: "Not logged in" });

  try {
    const {
      serviceName,
      price,
      description,
      duration,
      businessId,
      calendarId,
      categoryId
    } = req.body;

    // 🔥 FIX: Convert string to boolean properly
   const isVisible = req.body.isVisible === "true" || req.body.isVisible === true;


    let imageUrl = null;
    if (req.file) {
      imageUrl = "/uploads/" + req.file.filename;
    }

    const addons = req.body.addons ? JSON.parse(req.body.addons) : [];

    const newService = new Service({
      serviceName,
      price,
      description,
      duration,
      businessId,
      calendarId,
      categoryId,
      imageUrl,
      isVisible, // ✅ boolean now
      createdBy: userId,
      addons,
    });

    await newService.save();

    res.status(201).json({ message: "Service created successfully", service: newService });
  } catch (err) {
    console.error("❌ Failed to create service:", err);
    res.status(500).json({ message: "Server error while creating service." });
  }
});
















//Create Business 

app.post("/create-business", upload.single("heroImage"), async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: "Not logged in" });

  try {
    // ✅ Parse the incoming "values" JSON string from the FormData
    const values = JSON.parse(req.body.values || "{}");

    const {
      businessName,
      yourName,
      phoneNumber,
      locationName,
      businessAddress,
      businessEmail,
    } = values;

    // ✅ Generate a unique slug
    let baseSlug = slugify(businessName, { lower: true, strict: true }).replace(/-/g, "");
    let slug = baseSlug;
    let suffix = 1;
    while (await Business.exists({ slug })) {
      slug = `${baseSlug}${suffix++}`;
    }

    // ✅ Handle uploaded image path (optional)
    const heroImagePath = req.file ? `/uploads/${req.file.filename}` : "";

    // ✅ Create new business
    const newBusiness = new Business({
      createdBy: userId,
      values: {
        businessName,
        yourName,
        phoneNumber,
        locationName,
        businessAddress,
        businessEmail,
        heroImage: heroImagePath,
        template: "default" // optional default
      },
      slug,
    });

    await newBusiness.save();
    res.status(200).json(newBusiness);
  } catch (err) {
    console.error("❌ Failed to save business:", err);
    res.status(500).json({ message: "Failed to save business" });
  }
});








// Route to get all businesses created by the logged-in user
app.get('/get-records/Business', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not logged in' });

    try {
        const businesses = await Business.find({
            createdBy: userId,
            isDeleted: false // This is important
        });
        console.log(`Get Businesses: Found ${businesses.length} active businesses for user ${userId}.`); // Add this for server-side debugging
        res.json(businesses);
    } catch (error) {
        console.error('Error fetching businesses:', error);
        res.status(500).json({ message: 'Failed to load businesses' });
    }
});



app.get("/get-business/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const business = await Business.findById(id);
    if (!business) {
     const res = await fetch(`/get-business-by-slug/${slug}`);
if (!res.ok) throw new Error("Business not found");
const business = await res.json();

    }

    res.json(business);
  } catch (err) {
    console.error("❌ Error fetching business by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/get-business-by-slug/:slug", async (req, res) => {
  const { slug } = req.params;
  console.log("🔎 Looking for slug:", slug);

  try {
   const business = await Business.findOne({
  slug,
  isDeleted: { $ne: true }
});

    console.log("✅ Found business:", business);

    if (!business) {
     return res.status(404).json({ error: "Business not found" });

    }

    res.json(business);
  } catch (err) {
    console.error("Error fetching business by slug:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put('/update-business/:id', upload.single('heroImage'), async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ message: 'Not logged in' });
    }
   const { id } = req.params; // The ID of the business to update
    const { businessName, yourName, phoneNumber, locationName, businessAddress, businessEmail } = req.body;

    // Construct an object for the updates to the 'values' subdocument
    const updateFields = {
        'values.businessName': businessName,
        'values.yourName': yourName,
        'values.phoneNumber': phoneNumber,
        'values.locationName': locationName,
        'values.businessAddress': businessAddress,
        'values.businessEmail': businessEmail
    };

    // Handle new image upload:
    if (req.file) {
        // If a new file is uploaded, update the heroImage path
        updateFields['values.heroImage'] = `/uploads/${req.file.filename}`;
        // OPTIONAL: Add logic here to delete the OLD image file from your server's /uploads directory
        // This prevents old, unused images from accumulating.
        // You would need to fetch the business first to get the old image path,
        // then use 'fs.unlink' to delete it, but be careful with error handling.
    }

    try {
        // First, find the existing business to check its current name and slug
        const existingBusiness = await Business.findOne({ _id: id, createdBy: userId });
        if (!existingBusiness) {
            return res.status(404).json({ message: 'Business not found or unauthorized.' });
        }

        let newSlug = existingBusiness.slug; // Keep existing slug by default

        // Check if businessName has changed to regenerate slug
        if (businessName && existingBusiness.values.businessName !== businessName) {
           let baseSlug = slugify(businessName, { lower: true, strict: true });
  let suffix = 1;
            let tempSlug = baseSlug;
            // Ensure the new slug is unique and not equal to another business's slug (excluding the current one)
            while (await Business.exists({ slug: tempSlug, _id: { $ne: id } })) {
                tempSlug = `${baseSlug}${suffix++}`;
            }
            newSlug = tempSlug;
            updateFields.slug = newSlug; // Add slug to updates if it changed
        }

        // Perform the update using findOneAndUpdate
        const updatedBusiness = await Business.findOneAndUpdate(
            { _id: id, createdBy: userId }, // Find by ID and userId for security
            { $set: updateFields }, // Apply all updates, including potential new slug and heroImage
            { new: true } // Return the updated document
        );

        if (!updatedBusiness) {
            // This case should ideally not happen if findOne() succeeded, but is a good safeguard.
            return res.status(404).json({ message: 'Business not found after update attempt.' });
        }

        res.status(200).json(updatedBusiness); // Send back the updated business object
    } catch (err) {
        console.error('Error updating business:', err);
        res.status(500).json({ message: 'Failed to update business' });
    }
});




//Delete business
// DELETE /delete-business/:id
app.delete('/delete-business/:id', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not logged in' });

  const { id } = req.params;
  try {
    // 1) Find the business (only if it belongs to this user)
    const biz = await Business.findOne({ _id: id, createdBy: userId });
    if (!biz) return res.status(404).json({ message: 'Business not found' });

    // 2) Soft-delete
    biz.isDeleted = true;
    biz.deletedAt = new Date();
    await biz.save();

    // 3) Cascade: soft-delete its calendars and categories too
    await Calendar.updateMany(
      { businessId: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date() }
    );
    await Category.updateMany(
      { businessId: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date() }
    );
    // …and any other related collections (services, etc.)…

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting business:', err);
    res.status(500).json({ message: 'Failed to delete business' });
  }
});

app.post("/save-last-business", async (req, res) => {
  const userId = req.session.userId;
  const { businessId } = req.body;

  if (!userId || !businessId) {
    return res.status(400).json({ message: "Missing user or businessId" });
  }

  try {
    await User.findByIdAndUpdate(userId, {
      lastSelectedBusinessId: businessId,
    });
    res.json({ message: "✅ Saved last selected business!" });
  } catch (err) {
    console.error("❌ Failed to save last business:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get # of services for a business
app.get("/get-service-count", async (req, res) => {
  const { businessId } = req.query;
  const count = await Service.countDocuments({ businessId, isDeleted: { $ne: true } });
  res.json({ count });
});

// Get # of clients for a business
app.get("/get-client-count", async (req, res) => {
  const { businessId } = req.query;
  const count = await Client.countDocuments({ businessId, isDeleted: { $ne: true } });
  res.json({ count });
});






                          ///Calendar Secton 
                          // server.js (or routes.js)
// Create a new Calendar
// Create a new Calendar
app.post('/create-calendar', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not logged in' });

  const { businessId, calendarName } = req.body;
  if (!businessId || !calendarName) {
    return res.status(400).json({ message: 'Missing businessId or calendarName' });
  }

  try {
    const cal = await Calendar.create({ businessId, calendarName, createdBy: userId });
    res.json(cal);
  } catch (err) {
    console.error('Error creating calendar:', err);
    res.status(500).json({ message: 'Failed to create calendar' });
  }
});

// Fetch all Calendars for the logged-in user
app.get('/get-calendars', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not logged in' });

    const { businessId } = req.query; // Get businessId from query parameters

    try {
        const query = {
            createdBy: userId,
            isDeleted: false // This filters calendars that are themselves soft-deleted
        };

        if (businessId) {
            // If a specific businessId is provided in the query, first ensure that business is not deleted
            const business = await Business.findOne({ _id: businessId, createdBy: userId, isDeleted: false });
            if (!business) {
                // If the specific business is deleted or not found, no calendars for it should be returned
                return res.json([]);
            }
            query.businessId = businessId; // Add businessId to the calendar query
        }

        // --- START OF CHANGE ---
        const cals = await Calendar.find(query)
                                   .populate({
                                       path: 'businessId',
                                       match: { isDeleted: false }, // ONLY populate if the referenced Business is NOT deleted
                                       // If you need specific fields from the business for client-side use
                                       // select: 'values.businessName isDeleted' // Example: select 'isDeleted' to check later if needed
                                   })
                                   .sort({ createdAt: -1 });

        // After populate, filter out calendars where the businessId was not populated
        // (i.e., the associated business was deleted and thus didn't match the populate 'match' condition)
        const filteredCals = cals.filter(cal => cal.businessId !== null);

        res.json(filteredCals);
        // --- END OF CHANGE ---

    } catch (err) {
        console.error('Error fetching calendars:', err);
        res.status(500).json({ message: 'Failed to load calendars' });
    }
});
app.get('/get-calendar/:id', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not logged in' });

    try {
        const calendar = await Calendar.findOne({ _id: req.params.id, createdBy: userId, isDeleted: false }).populate('businessId');
        if (!calendar) {
            return res.status(404).json({ message: 'Calendar not found or not authorized' });
        }
        res.json(calendar); // This is what your JS expects for the popup to populate
    } catch (err) {
        console.error('Error fetching single calendar:', err);
        // Handle Mongoose CastError for invalid ObjectIDs (e.g., if someone types a bad ID)
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Calendar ID format' });
        }
        res.status(500).json({ message: 'Failed to fetch calendar' });
    }
});
app.get("/get-calendars/:businessId", async (req, res) => {
  try {
    const calendars = await Calendar.find({
      businessId: req.params.businessId,
      isDeleted: { $ne: true }
    });

    res.json(calendars);
  } catch (err) {
    console.error("Failed to load calendars:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//Update Calendar 
app.put('/update-calendar/:id', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not logged in' });

  const { id } = req.params;
  const { businessId, calendarName } = req.body;
  if (!businessId || !calendarName) {
    return res.status(400).json({ message: 'Missing businessId or calendarName' });
  }

  try {
    const cal = await Calendar.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { businessId, calendarName },
      { new: true }
    );
    if (!cal) return res.status(404).json({ message: 'Calendar not found' });
    res.json(cal);
  } catch (err) {
    console.error('Error updating calendar:', err);
    res.status(500).json({ message: 'Failed to update calendar' });
  }
});


//Delete Calendar 
// soft‐delete a calendar
app.delete('/delete-calendar/:id', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not logged in' });

  try {
    const cal = await Calendar.findOne({ _id: req.params.id, createdBy: userId });
    if (!cal) return res.status(404).json({ message: 'Calendar not found' });

    cal.isDeleted = true;
    cal.deletedAt = new Date();
    await cal.save();

    res.sendStatus(200);
  } catch (err) {
    console.error('Error deleting calendar:', err);
    res.status(500).json({ message: 'Failed to delete calendar' });
  }
});

app.post("/set-default-calendar", async (req, res) => {
  const { calendarId, businessId } = req.body;

  try {
    // 1. Unset all calendars for this business
    await Calendar.updateMany({ businessId }, { $set: { isDefault: false } });

    // 2. Set this one as default
    await Calendar.findByIdAndUpdate(calendarId, { $set: { isDefault: true } });

    res.status(200).json({ message: "Default calendar updated" });
  } catch (err) {
    console.error("❌ Failed to set default calendar:", err);
    res.status(500).json({ message: "Error setting default calendar" });
  }
});

                                                   //Category
app.post('/create-category', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not logged in' });

  const { businessId, calendarId, categoryName } = req.body;
  if (!businessId || !calendarId || !categoryName) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const newCat = new Category({
      businessId,
      calendarId,
      categoryName,
      createdBy: userId
    });
    await newCat.save();
    res.json(newCat);
  } catch (err) {
    console.error('Error saving category:', err);
    res.status(500).json({ message: 'Failed to create category' });
  }
});



app.get('/get-records/Category', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    const { businessId, calendarId } = req.query; // Get query parameters

    try {
        const query = {
            createdBy: userId,
            isDeleted: false // 1. Always filter out categories that are themselves soft-deleted
        };

        // If a specific businessId is requested, add it to the query
        // And pre-verify the business is active if a specific ID is given
        if (businessId) {
            const business = await Business.findOne({ _id: businessId, createdBy: userId, isDeleted: false });
            if (!business) {
                return res.json([]); // If the specific business is deleted or not found, return no categories for it
            }
            query.businessId = businessId;
        }

        // If a specific calendarId is requested, add it to the query
        // And pre-verify the calendar is active if a specific ID is given
        if (calendarId) {
            const calendar = await Calendar.findOne({ _id: calendarId, createdBy: userId, isDeleted: false });
            if (!calendar) {
                return res.json([]); // If the specific calendar is deleted or not found, return no categories for it
            }
            query.calendarId = calendarId;
        }

        // --- NEW: Fetch categories and populate business and calendar fields ---
        // Use populate with a 'match' condition to only bring back associated documents
        // that are NOT deleted. This simplifies client-side logic.
        let categories = await Category.find(query)
            .populate({
                path: 'businessId',
                match: { isDeleted: false }, // Only populate if the associated Business is NOT deleted
                select: 'values.businessName' // Only fetch the business name
            })
            .populate({
                path: 'calendarId',
                match: { isDeleted: false }, // Only populate if the associated Calendar is NOT deleted
                select: 'calendarName' // Only fetch the calendar name
            })
            .sort({ createdAt: -1 }); // Optional: order categories by creation date

        // --- NEW: Filter out categories whose parent Business or Calendar couldn't be populated ---
        // If businessId or calendarId are deleted, populate.match will make them 'null'.
        const filteredCategories = categories.filter(category =>
            category.businessId !== null && category.calendarId !== null
        );

        res.json(filteredCategories); // Send the filtered and populated categories

    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ message: 'Failed to load categories' });
    }
});

// Get Single Category by ID (for editing)
app.get('/get-record/Category/:id', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not logged in' });

  try {
    const category = await Category.findOne({
      _id: req.params.id,
      createdBy: userId,
      isDeleted: false
    })
    .populate({
      path: 'businessId',
      match: { isDeleted: false },
      select: '_id values.businessName'
    })
    .populate({
      path: 'calendarId',
      match: { isDeleted: false },
      select: '_id calendarName'
    });

    if (!category) return res.status(404).json({ message: 'Category not found' });

    res.json(category);
  } catch (err) {
    console.error("Error fetching category by ID:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Category Record
app.put('/update-record/Category/:id', async (req, res) => {
    // 1. Get the category ID from the URL parameters
    const categoryId = req.params.id;

    // 2. Get the updated data from the request body
    // Ensure these field names match what you send from the frontend:
    const { categoryName, businessId, calendarId } = req.body;

    // 3. Get the userId from the session (to ensure the user is logged in and authorized)
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    try {
        // 4. Find the category by its ID and ensure it was created by the logged-in user
        //    'new: true' returns the updated document
        //    'runValidators: true' ensures Mongoose schema validators run on update
        const updatedCategory = await Category.findOneAndUpdate(
            {
                _id: categoryId,
                createdBy: userId, // CRITICAL: Ensures only the creator can update
                isDeleted: false   // Assuming you have a soft-delete mechanism
            },
            {
                // Using $set explicitly is good practice for clarity and partial updates
                $set: {
                    categoryName: categoryName,
                    businessId: businessId,
                    calendarId: calendarId
                }
            },
            { new: true, runValidators: true } // Ensure updated document is returned and validators run
        );

        // 5. Handle cases where the category wasn't found or wasn't created by this user
        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found or you are not authorized to update it.' });
        }

        // 6. Send a success response
        res.json({ message: 'Category updated successfully', category: updatedCategory });

    } catch (error) {
        console.error('Error updating category:', error);
        // Handle Mongoose validation errors or other server errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message, errors: error.errors }); // Send specific validation errors
        }
        res.status(500).json({ message: 'Failed to update category due to a server error.' });
    console.log("Received update data:", { categoryName, businessId, calendarId });
}
});

app.delete('/delete-record/Category/:id', async (req, res) => {
    const categoryId = req.params.id;
    const userId = req.session.userId; // Assuming user ID is in session

    if (!userId) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    try {
        // Find the category by ID and createdBy, then mark as deleted
        // We only "delete" (mark as isDeleted: true) if it's not already deleted
        const deletedCategory = await Category.findOneAndUpdate(
            {
                _id: categoryId,
                createdBy: userId, // Ensure only the creator can delete
                isDeleted: false   // Only allow deletion if it's currently active (not already deleted)
            },
            {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date() // Record the time of deletion
                }
            },
            { new: true } // Return the updated (deleted) document
        );

        if (!deletedCategory) {
            // Category not found, already deleted, or not authorized for this user
            return res.status(404).json({ message: 'Category not found, already deleted, or you are not authorized to delete it.' });
        }

        res.json({ message: 'Category deleted successfully (soft delete)', category: deletedCategory });

    } catch (error) {
        console.error('Error soft-deleting category:', error);
        res.status(500).json({ message: 'Failed to delete category due to a server error.' });
    }
});


app.post('/create-service', ensureAuthenticated, upload.single("image"), async (req, res) => {
  try {
    const {
      serviceName,
      price,
      description,
      duration,
      businessId,
      calendarId,
      categoryId,
     
    } = req.body;
const isVisible = req.body.isVisible === "true" || req.body.isVisible === true;

    let addons = [];
try {
  if (req.body.addons) {
    addons = JSON.parse(req.body.addons);
  }
} catch (err) {
  console.error("❌ Failed to parse addons:", err.message);
  return res.status(400).json({ message: "Invalid format for add-ons." });
}

const isVisibleBool = isVisible === "true"; 
    // Get user ID from session
    const createdBy = req.session.userId;

    // ✅ Build image URL if uploaded
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";

    console.log("✅ Incoming create-service request:", {
      serviceName,
      price,
      duration,
      businessId,
      calendarId,
      categoryId,
      createdBy,
      imageUrl
    });

    // Validate required fields
    if (!serviceName || !price || !duration || !businessId || !calendarId || !categoryId || !createdBy) {
      return res.status(400).json({
        message: 'Please enter all required fields (Name, Price, Duration, Business, Calendar, Category).'
      });
    }

    if (price < 0) return res.status(400).json({ message: 'Price cannot be negative.' });
    if (duration <= 0) return res.status(400).json({ message: 'Duration must be at least 1 minute.' });

    // Check for duplicate
    const existingService = await Service.findOne({
      serviceName,
      businessId,
      calendarId,
      categoryId,
      createdBy,
      isDeleted: false
    });

    if (existingService) {
      return res.status(409).json({
        message: 'A service with this name already exists for the selected business, calendar, and category.'
      });
    }

    // Create the service
    const newService = await Service.create({
      serviceName,
      price,
      description,
      duration,
      imageUrl,
      businessId,
      calendarId,
      categoryId,
      createdBy,
      addons,
     
    });

    // Optional: populate references if needed
    const populatedService = await Service.findById(newService._id)
      .populate('businessId')
      .populate('calendarId')
      .populate('categoryId');

    res.status(201).json(populatedService);

  } catch (error) {
    console.error("❌ Error creating service:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error creating service', error: error.message });
  }
});

app.get('/get-records/Service', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Not logged in' });

    const { businessId, calendarId, categoryId } = req.query;
    console.log("📥 Fetching services with:", { businessId, calendarId, categoryId });

    try {
        const query = {
            createdBy: userId,
            isDeleted: false
        };

        // ✅ Validate and apply business filter
        if (businessId && businessId !== "undefined" && businessId.trim() !== "") {
            if (!mongoose.Types.ObjectId.isValid(businessId)) {
                return res.status(400).json({ message: 'Invalid businessId format' });
            }

            const business = await Business.findOne({ _id: businessId, createdBy: userId, isDeleted: false });
            if (!business) return res.json([]);
            query.businessId = businessId;
        }

        // ✅ Validate and apply calendar filter
        if (calendarId && calendarId !== "undefined" && calendarId.trim() !== "") {
            if (!mongoose.Types.ObjectId.isValid(calendarId)) {
                return res.status(400).json({ message: 'Invalid calendarId format' });
            }

            const calendar = await Calendar.findOne({ _id: calendarId, createdBy: userId, isDeleted: false });
            if (!calendar) return res.json([]);
            query.calendarId = calendarId;
        }

        // ✅ Validate and apply category filter
        if (categoryId && categoryId !== "undefined" && categoryId.trim() !== "") {
            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                return res.status(400).json({ message: 'Invalid categoryId format' });
            }

            const category = await Category.findOne({ _id: categoryId, createdBy: userId, isDeleted: false });
            if (!category) return res.json([]);
            query.categoryId = categoryId;
        }

        const services = await Service.find(query)
            .populate({
                path: 'businessId',
                match: { isDeleted: false },
                select: 'values.businessName'
            })
            .populate({
                path: 'calendarId',
                match: { isDeleted: false },
                select: 'calendarName'
            })
            .populate({
                path: 'categoryId',
                match: { isDeleted: false },
                select: 'categoryName'
            })
            .sort({ createdAt: -1 });

        const filtered = services.filter(service =>
            service.businessId !== null &&
            service.calendarId !== null &&
            (service.categoryId === null || service.categoryId.isDeleted === false || service.categoryId)
        );

        res.json(filtered);
    } catch (err) {
        console.error('❌ Error fetching services:', err.message, err.stack);
        res.status(500).json({ message: 'Failed to load services' });
    }
});


app.get('/get-records/Service/:id', async (req, res) => {
    const userId = req.session.userId;
    const serviceId = req.params.id; // Get the ID from the URL parameter

    if (!userId) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    try {
        const service = await Service.findOne({
            _id: serviceId,
            createdBy: userId,
            isDeleted: false // Only fetch if not soft-deleted
        })
        .populate({
            path: 'businessId',
            match: { isDeleted: false },
            select: 'values.businessName'
        })
        .populate({
            path: 'calendarId',
            match: { isDeleted: false },
            select: 'calendarName'
        })
        .populate({
            path: 'categoryId',
            match: { isDeleted: false },
            select: 'categoryName'
        });

        if (!service || service.businessId === null || service.calendarId === null || (service.categoryId && service.categoryId.isDeleted)) {
            return res.status(404).json({ message: 'Service not found or associated records deleted.' });
        }

        res.json(service);
    } catch (err) {
        console.error(`Error fetching service with ID ${serviceId}:`, err);
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Service ID format.' });
        }
        console.log("Service Fetch Query:", query);

        res.status(500).json({ message: 'Failed to load service.' });
    }
});

// Update Service Record
// PUT: Update Service (for FormData-based updates)
app.put('/update-service/:id', ensureAuthenticated, upload.single("image"), async (req, res) => {
  try {
    const {
      serviceName,
      price,
      description,
      duration,
      businessId,
      calendarId,
      categoryId,
    } = req.body;
const isVisible = req.body.isVisible === "true" || req.body.isVisible === true;

    const numericPrice = parseFloat(price);
const numericDuration = parseInt(duration);
const isVisibleBool = isVisible === "true";

let addons = [];
try {
  if (req.body.addons) {
    addons = JSON.parse(req.body.addons);
      console.log("🧩 Parsed addons:", addons);
  }
} catch (err) {
  console.error("❌ Failed to parse addons:", err.message);
  return res.status(400).json({ message: "Invalid format for add-ons." });
}


    const userId = req.session.userId;
    const serviceId = req.params.id;

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

   const updateFields = {
  serviceName,
  price: numericPrice,
  description,
  duration: numericDuration,
  businessId,
  calendarId,
  categoryId,
 
  addons,
  updatedAt: new Date()
};
    if (imageUrl !== undefined) {
      updateFields.imageUrl = imageUrl;
    }

    const updatedService = await Service.findOneAndUpdate(
      { _id: serviceId, createdBy: userId, isDeleted: false },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedService) {
      return res.status(404).json({ message: "Service not found or not authorized." });
    }

    res.json({ message: "✅ Service updated", service: updatedService });

  } catch (err) {
    console.error("❌ Update service error:", err);
    res.status(500).json({ message: "Failed to update service." });
  }
});


//Delete Service 
app.delete('/delete-record/Service/:id', ensureAuthenticated, async (req, res) => { // Added ensureAuthenticated for security
    const serviceId = req.params.id;
    const userId = req.session.userId; // Assuming user ID is in session

    // The `ensureAuthenticated` middleware should handle the initial login check.
    // If ensureAuthenticated is NOT used, you'd need to uncomment this check:
    // if (!userId) {
    //     return res.status(401).json({ message: 'Not logged in' });
    // }

    try {
        // Find the service by its ID and createdBy, then mark it as deleted
        // We only "delete" (mark as isDeleted: true) if it's not already deleted and owned by the user.
        const deletedService = await Service.findOneAndUpdate(
            {
                _id: serviceId,
                createdBy: userId,  // CRITICAL: Ensures only the creator can delete their own service
                isDeleted: false    // Only allow deletion if it's currently active (not already deleted)
            },
            {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date() // Record the time of deletion
                }
            },
            { new: true } // Return the updated (deleted) document
        );

        if (!deletedService) {
            // Service not found, already deleted, or not authorized for this user
            return res.status(404).json({ message: 'Service not found, already deleted, or you are not authorized to delete it.' });
        }

        res.json({ message: 'Service deleted successfully (soft delete)', service: deletedService });

    } catch (error) {
        console.error('Error soft-deleting service:', error);
        res.status(500).json({ message: 'Failed to delete service due to a server error.' });
    }
});


//Booking Page Template 
app.put("/update-template/:id", async (req, res) => {
  const businessId = req.params.id;
  const { template } = req.body;

  console.log("🛠 Incoming update request for ID:", businessId);
  console.log("🧩 New template:", template);

  try {
  const business = await Business.findByIdAndUpdate(
  businessId,
  { $set: { "values.template": template } },
  { new: true }
);

    if (!business) {
      console.log("❌ No record found with that ID!");
      return res.status(404).json({ message: "Business not found" });
    }

    res.status(200).json({ message: "Template updated", business });
  } catch (err) {
    console.error("Error updating template:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/debug-businesses", async (req, res) => {
  const businesses = await Record.find({ dataType: "Business" });
  res.json(businesses);
});


//Client
app.post("/add-client", async (req, res) => {
  const { businessId, firstName, lastName, phone, email } = req.body;
  const createdBy = req.session.userId;

  if (!createdBy) return res.status(401).json({ message: "Not logged in" });
  if (!businessId || !firstName) return res.status(400).json({ message: "Missing required fields" });

  try {
    // ✅ Try to find an existing user (someone who may later log in)
    let matchedUser = null;
    if (email) {
      matchedUser = await User.findOne({ email });
    } else if (phone) {
      matchedUser = await User.findOne({ phone });
    }

    // ✅ Check if a client with same email/phone + business already exists
    let client = await Client.findOne({
      businessId,
      $or: [{ email }, { phone }],
    });

    if (client) {
      // ✅ Update fields if client already exists
      client.firstName = firstName;
      client.lastName = lastName;
      if (matchedUser) client.userId = matchedUser._id;
      await client.save();
    } else {
      // ✅ Create new client
      client = await Client.create({
        createdBy,
        businessId,
        firstName,
        lastName,
        phone,
        email,
        userId: matchedUser ? matchedUser._id : null,
      });
    }

    res.status(201).json({ message: "Client saved", client });
  } catch (err) {
    console.error("❌ Failed to create/update client:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.put("/update-client/:id", async (req, res) => {
  const userId = req.session.userId;
  const clientId = req.params.id;
  const { businessId, firstName, lastName, phone, email } = req.body;

  if (!userId) return res.status(401).json({ message: "Not logged in" });

  try {
    const updatedClient = await Client.findOneAndUpdate(
      { _id: clientId, createdBy: userId },
      { businessId, firstName, lastName, phone, email },
      { new: true }
    );

    if (!updatedClient) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json({ message: "Client updated", client: updatedClient });
  } catch (err) {
    console.error("❌ Failed to update client:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/get-clients/:businessId", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: "Not logged in" });

  const { businessId } = req.params;

  try {
    const clients = await Client.find({
      businessId,
      createdBy: userId,
      isDeleted: false
    });

    res.json(clients);
  } catch (err) {
    console.error("Error fetching clients:", err);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});

app.get("/get-all-clients", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: "Not logged in" });

  try {
    const clients = await Client.find({ createdBy: userId, isDeleted: false });
    res.json(clients);
  } catch (err) {
    console.error("Error fetching all clients:", err);
    res.status(500).json({ message: "Failed to fetch all clients" });
  }
});
app.get("/get-all-clients/:businessId", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: "Not logged in" });

  const { businessId } = req.params;

  try {
    // 1. Clients manually created by the business owner
    const manualClients = await Client.find({
      createdBy: userId,
      isDeleted: false,
    });

    // 2. Clients who booked an appointment with this business
    const appointments = await Appointment.find({ businessId }).select("clientId");
    const bookedClientIds = appointments.map((appt) => appt.clientId.toString());

    // Merge and remove duplicates
    const combinedIds = Array.from(
      new Set([
        ...manualClients.map((c) => c._id.toString()),
        ...bookedClientIds,
      ])
    );

    // 3. Fetch full client objects
    const allClients = await Client.find({
      _id: { $in: combinedIds },
      isDeleted: false,
    }).sort({ firstName: 1 });

    res.json(allClients);
  } catch (err) {
    console.error("Error fetching merged clients:", err);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});

// ✅ KEEP THIS ONE — it handles everything
app.get("/get-my-clients", async (req, res) => {
  const userId = req.session.userId;
  const businessId = req.query.businessId; // optional

  if (!userId) return res.status(401).json({ message: "Not logged in" });

  try {
    // 1. Manual clients created by the user (optionally filter by businessId)
    const manualClients = await Client.find({
      createdBy: userId,
      isDeleted: false,
      ...(businessId ? { businessId } : {}),
    });

    // 2. Clients who booked with one of the user’s businesses
    const businessQuery = businessId ? { businessId } : { createdBy: userId };
    const appointments = await Appointment.find(businessQuery).select("clientId");
    const bookedClientIds = appointments.map((appt) => appt.clientId.toString());

    // Merge manual + booked
    const combinedIds = Array.from(
      new Set([
        ...manualClients.map((c) => c._id.toString()),
        ...bookedClientIds,
      ])
    );

    // 3. Get full client data, sorted A–Z
    const allClients = await Client.find({
      _id: { $in: combinedIds },
      isDeleted: false,
    }).sort({ firstName: 1 });

    res.json(allClients);
  } catch (err) {
    console.error("❌ Error fetching clients:", err);
    res.status(500).json({ message: "Failed to load clients" });
  }
});


app.delete("/delete-client/:id", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: "Not logged in" });

  const { id } = req.params;

  try {
    const deleted = await Client.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json({ message: "Client deleted", deleted });
  } catch (err) {
    console.error("Error deleting client:", err);
    res.status(500).json({ message: "Failed to delete client" });
  }
});


//Appointment
app.post("/save-availability", async (req, res) => {
  const userId = req.session.userId;
  const { businessId, calendarId, availability } = req.body;

  if (!userId) return res.status(401).json({ message: "Not logged in" });
  if (!businessId || !calendarId || !Array.isArray(availability)) {
    return res.status(400).json({ message: "Missing data" });
  }

  try {
    const doc = await Availability.create({
      createdBy: userId,
      businessId,
      calendarId,
      availability
    });


    res.json({ message: "Availability saved", doc });
  } catch (err) {
    console.error("❌ Error saving availability:", err);
    res.status(500).json({ message: "Server error" });
  }
});


//Upcoming Hours
app.post("/save-upcoming-hours", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: "Not logged in" });

  const { businessId, calendarId, upcomingHours, weekStartDate } = req.body;

  if (!weekStartDate) {
    return res.status(400).json({ message: "Missing weekStartDate" });
  }

  if (!businessId || !calendarId || !Array.isArray(upcomingHours)) {
    return res.status(400).json({ message: "Missing required fields or invalid format" });
  }

  try {
  // ✅ DEBUG LOGGING
  console.log("📦 Saving upcoming hours for week:", weekStartDate);
  console.log("💾 Incoming hours:", upcomingHours);

  const dateList = upcomingHours.map(hour => new Date(hour.date));
  await UpcomingHours.deleteMany({
    businessId,
    calendarId,
    date: { $in: dateList }
  });

 const newDocs = upcomingHours.map(item => ({
  ...item,
  isAvailable: item.isAvailable === true || item.isAvailable === "true",  // 🔧 clean boolean
  businessId,
  calendarId,
  weekStartDate: new Date(weekStartDate)
}));
console.log("🧾 Final docs to save:", newDocs);

  await UpcomingHours.insertMany(newDocs);

  res.status(200).json({ message: "Upcoming hours saved successfully" });
} catch (err) {
  console.error("❌ Failed to save upcoming hours:", err);
  res.status(500).json({ message: "Server error saving upcoming hours" });
}

}); 

// GET /get-day-availability?businessId=xxx&calendarId=yyy&date=2025-07-08
app.get("/get-day-availability", async (req, res) => {
  const { businessId, calendarId, date } = req.query;

  if (!businessId || !calendarId || !date) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  try {
    const parsedDate = new Date(date);
    
    const doc = await UpcomingHours.findOne({
      businessId,
      calendarId,
      date: parsedDate
    });

    if (!doc) {
      return res.json({ start: null, end: null });
    }

    res.json({ start: doc.start, end: doc.end });
  } catch (err) {
    console.error("❌ Error fetching day availability:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// POST /save-day-availability
app.post("/save-day-availability", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: "Not logged in" });

  const { businessId, calendarId, date, start, end } = req.body;

  try {
    console.log("📥 Incoming Save:", { businessId, calendarId, date, start, end });

    const parsedDate = new Date(date);

    await UpcomingHours.deleteMany({ businessId, calendarId, date: parsedDate });

    const saved = await UpcomingHours.create({
      businessId,
      calendarId,
      date: parsedDate,
      start,
      end,
      createdBy: userId
    });

    console.log("✅ Saved Document:", saved);

    res.status(200).json({ message: "Availability saved" });
  } catch (err) {
    console.error("❌ Error saving availability:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/get-all-availability", async (req, res) => {
  const { businessId, calendarId } = req.query;

  if (!businessId || !calendarId) {
    return res.status(400).json({ message: "Missing required IDs" });
  }

  try {
    const availability = await Availability.find({ businessId, calendarId });
    res.json({ availability }); // ✅ must send it like this
  } catch (err) {
    console.error("❌ Error fetching availability:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/add-upcoming-hour", async (req, res) => {
  const { businessId, calendarId, date, startTime, endTime } = req.body;
  const userId = req.session.userId;

  if (!userId) return res.status(401).json({ message: "Not logged in" });

  try {
    // ✅ Convert incoming date string to local midnight to prevent shifting
    const raw = new Date(date); // e.g. "2025-09-01"
    raw.setHours(0, 0, 0, 0);   // Sets it to 00:00:00 LOCAL time

    const newHour = await UpcomingHours.create({
      createdBy: userId,
      businessId,
      calendarId,
      date: raw, // ✅ Save the adjusted date
      startTime,
      endTime
    });

    console.log("✅ Saved UpcomingHour:", newHour);

    res.status(200).json({ message: "Upcoming hour saved", newHour });
  } catch (err) {
    console.error("❌ Error saving upcoming hour:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /get-upcoming-hours?businessId=xxx&calendarId=yyy&start=2025-07-01
app.get("/get-all-upcoming-hours", async (req, res) => {
  const { businessId, calendarId, start } = req.query;

  if (!businessId || !calendarId) {
    return res.status(400).json({ message: "Missing businessId or calendarId" });
  }

  try {
    const startDate = start ? new Date(start) : new Date();
    startDate.setUTCHours(0, 0, 0, 0); // 👈 make sure we start from 00:00 UTC

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 31); // grab full month
    endDate.setUTCHours(23, 59, 59, 999); // 👈 include last full day

    console.log("🔍 Date range:", startDate, "to", endDate); // helpful for debugging

    const upcomingHours = await UpcomingHours.find({
      businessId,
      calendarId,
      date: { $gte: startDate, $lt: endDate }
    });

    console.log("📦 Sending upcomingHours:", upcomingHours);
    res.json({ upcomingHours });
  } catch (err) {
    console.error("❌ Error in /get-all-upcoming-hours:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// POST /get-upcoming-hours
app.post("/get-upcoming-hours", async (req, res) => {
  const { calendarId, date } = req.body;

  if (!calendarId || !date) {
    return res.status(400).json({ message: "Missing calendarId or date" });
  }

  try {
    const hoursDoc = await UpcomingHours.findOne({
      calendarId,
      date,
    });

    if (!hoursDoc || !hoursDoc.isAvailable || !hoursDoc.start || !hoursDoc.end) {
      return res.json([]);
    }

    res.json([`${hoursDoc.start} - ${hoursDoc.end}`]);
  } catch (err) {
    console.error("❌ Error fetching upcoming hours:", err);
    res.status(500).json({ message: "Internal error" });
  }
});

app.get("/get-appointments", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: "Not logged in" });

  const { businessId } = req.query;

  try {
    // 1. Find businesses created by this user
    const businesses = await Business.find(
      businessId && businessId !== ""
        ? { _id: businessId, createdBy: userId }
        : { createdBy: userId }
    );
    const businessIds = businesses.map(b => b._id);

    // 2. Find calendars under those businesses
    const calendars = await Calendar.find({ businessId: { $in: businessIds } });
    const calendarIds = calendars.map(c => c._id);

    // 3. Find all appointments linked to those calendars
    const appointments = await Appointment.find({
      calendarId: { $in: calendarIds },
      isDeleted: { $ne: true }
    });

    // 4. Enrich appointments with client and service info
    const enriched = await Promise.all(
      appointments.map(async (appt) => {
        const client = await Client.findById(appt.clientId);
        const service = await Service.findById(appt.serviceId);

        return {
          _id: appt._id,
          clientName: client ? `${client.firstName} ${client.lastName || ""}`.trim() : "Unknown Client",
          serviceName: service ? (service.serviceName || "Unnamed Service") : "Unknown Service",
          date: appt.appointmentDate,
          time: appt.appointmentTime,
          duration: appt.duration,
          clientId: appt.clientId,
          serviceId: appt.serviceId,
          businessId: appt.businessId
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error("Error loading appointments:", err);
    res.status(500).json({ message: "Failed to load appointments" });
  }
});

app.get("/get-client-appointments", async (req, res) => {
  const userIdFromSession = req.session.userId;
  console.log(`Backend: req.session.userId is: "${userIdFromSession}"`);

  if (!userIdFromSession) {
    return res.status(401).json({ message: "Not logged in" });
  }

  try {
    // 🔍 First find the Client record tied to this logged-in user
  const loggedInUser = await User.findById(userIdFromSession);

const clients = await Client.find({
  $or: [
    { userId: userIdFromSession },
    { email: loggedInUser?.email }
  ]
});


if (!clients || clients.length === 0) {
  console.log("❌ No Client profile(s) found for this user.");
  return res.json([]);
}

const clientIds = clients.map(c => c._id);

const appointments = await Appointment.find({
  clientId: { $in: clientIds },
  isDeleted: { $ne: true }
});


    console.log(`✅ Found ${appointments.length} appointments for this client`);

    const enriched = await Promise.all(
      appointments.map(async (appt) => {
        let businessSlug = "";
         let proName = "";
        let serviceName = appt.serviceName || "Unknown Service";
try {
const business = await Business.findById(appt.businessId);


if (business?.slug) {
  businessSlug = business.slug; // slug is outside .values
}

if (business?.values?.yourName) {
  proName = business.values.yourName;
}

} catch (err) {
  console.warn("⚠️ Could not load business info:", err);
}


        try {
          const service = await Service.findById(appt.serviceId);
          if (service?.serviceName) {
            serviceName = service.serviceName;
          }
        } catch (err) {
          console.warn("⚠️ Could not load service info:", err);
        }

return {
  _id: appt._id,
  date: appt.appointmentDate,
  time: appt.appointmentTime,
  duration: appt.duration,
  serviceName,
  businessSlug,
  proName,
  serviceId: appt.serviceId,
  businessId: appt.businessId, // ✅ Add this line!
  businessServices: await Service.find({
    businessId: appt.businessId,
    isDeleted: false
  }).select("_id serviceName")
};


      })
    );

    return res.json(enriched);
  } catch (err) {
    console.error("❌ Error loading client appointments:", err);
    return res.status(500).json({ message: "Failed to load appointments" });
  }
});



//reschedule appointment
app.post("/soft-hold-appointment/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    const updated = await Appointment.findByIdAndUpdate(
      id,
      { softHoldExpiresAt: expiresAt },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "✅ Appointment soft-held for 5 minutes" });
  } catch (err) {
    console.error("❌ Soft hold error:", err);
    res.status(500).json({ message: "Server error during soft hold" });
  }
});

app.post("/reschedule-appointment", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: "Not logged in" });

  const { appointmentId, serviceId, date, time } = req.body;

  if (!appointmentId || !serviceId || !date || !time) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Lookup the selected service to get the updated duration
    const selectedService = await Service.findById(serviceId);
    if (!selectedService) {
      return res.status(404).json({ message: "Selected service not found" });
    }

    const updated = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        serviceId,
        serviceName: selectedService.serviceName,
        appointmentDate: date,
        appointmentTime: time,
        duration: selectedService.duration,
      },
      { new: true }
    );

    console.log("✅ Appointment successfully rescheduled:", updated);
    return res.json({ message: "Appointment rescheduled", appointment: updated });
  } catch (err) {
    console.error("❌ Error rescheduling appointment:", err);
    return res.status(500).json({ message: "Failed to reschedule appointment" });
  }
});

app.get("/get-categories-and-services/:businessId", async (req, res) => {
  try {
    const categories = await Category.find({ businessId: req.params.businessId });
    const services = await Service.find({ businessId: req.params.businessId });
    res.json({ categories, services });
  } catch (err) {
    console.error("❌ Error fetching categories/services:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/get-client/:id", async (req, res) => {
  const userId = req.session.userId;
  const clientId = req.params.id;

  if (!userId) return res.status(401).json({ message: "Not logged in" });

  try {
    const client = await Client.findOne({ _id: clientId, createdBy: userId });
    if (!client) return res.status(404).json({ message: "Client not found" });

    res.json(client);
  } catch (err) {
    console.error("Error getting client:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/update-appointment/:id", async (req, res) => {
  const appointmentId = req.params.id;
  console.log("🔵 Updating appointment with ID:", appointmentId);

  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

  const { appointmentTime, appointmentDate, clientId, serviceId, duration } = req.body;
  console.log("🟡 Update payload:", { appointmentTime, appointmentDate, clientId, serviceId, duration });

  try {
    const updated = await Appointment.findOneAndUpdate(
      { _id: appointmentId, createdBy: userId },
      {
        $set: {
          appointmentTime,
          appointmentDate,
          clientId,
          serviceId,
          duration: Number(duration) || 30,
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    res.status(200).json({ success: true, appointment: updated });

  } catch (err) {
    console.error("❌ Failed to update appointment:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//Delete Appointment
app.delete("/delete-appointment/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await Appointment.findByIdAndDelete(id);
    res.json({ message: "Appointment deleted" });
  } catch (err) {
    console.error("❌ Error deleting appointment:", err);
    res.status(500).json({ message: "Server error" });
  }
});


//Client Dashboard Page 
app.delete("/cancel-appointment/:id", async (req, res) => {
    const { id } = req.params;
    const userId = req.session.userId;

    // --- ADD THIS LOGGING ---
    console.log(`➡️ Attempting to cancel appointment with ID: ${id} by user: ${userId}`);
    // --- END ADDED LOGGING ---

    if (!userId) {
        console.warn(`⚠️ Cancellation attempt for ID ${id}: User not logged in.`);
        return res.status(401).json({ message: "Not logged in" });
    }

    try {
        // Find the appointment BEFORE attempting to update
        const preUpdateAppt = await Appointment.findById(id);
        if (preUpdateAppt) {
            console.log("🔍 Pre-cancellation appointment state:", {
                id: preUpdateAppt._id,
                isDeleted: preUpdateAppt.isDeleted,
                appointmentDate: preUpdateAppt.appointmentDate,
                appointmentTime: preUpdateAppt.appointmentTime
            });
        } else {
            console.warn(`⚠️ Pre-cancellation check: Appointment with ID ${id} not found.`);
        }

        // Perform the update, ensuring 'new: true' to get the updated document
        const updatedAppt = await Appointment.findByIdAndUpdate(
            id,
            {
                $set: {
                    isDeleted: true,
                    canceledBy: userId, // ✅ Save who canceled
                    deletedAt: new Date() // Also set deletedAt for completeness
                }
            },
            { new: true } // IMPORTANT: Returns the modified document rather than the original.
        );

        if (!updatedAppt) {
            console.warn(`⚠️ Cancellation failed: Appointment with ID ${id} not found after update attempt.`);
            return res.status(404).json({ message: "Appointment not found." });
        }

        // --- ADD THIS LOGGING ---
        console.log("✅ Appointment successfully cancelled (updated state):", {
            id: updatedAppt._id,
            isDeleted: updatedAppt.isDeleted,
            appointmentDate: updatedAppt.appointmentDate,
            appointmentTime: updatedAppt.appointmentTime,
            deletedAt: updatedAppt.deletedAt
        });

        // Trigger a re-fetch on the client side after successful cancellation
        // (You might need a custom event or a different approach depending on your client-side architecture)
        // For now, let's just make sure the server logs are correct.

        // --- END ADDED LOGGING ---
const io = req.app.get("socketio");
io.emit("appointmentUpdated", {
  calendarId: updatedAppt.calendarId,
  date: updatedAppt.appointmentDate
});

        res.status(200).json({ message: "Appointment canceled." });
    } catch (err) {
        console.error(`❌ Error canceling appointment ID ${id}:`, err);
        res.status(500).json({ message: "Failed to cancel appointment." });
    }
});

//Public-booking page 
// Public route to get a business by slug
app.post("/get-records", async (req, res) => {
  const { dataType, filter } = req.body;

  try {
    if (dataType === "Business") {
      const records = await Business.find({ ...filter });
      return res.json(records);
    }

    if (dataType === "Calendar") {
      const records = await Calendar.find({ ...filter });
      return res.json(records);
    }

    if (dataType === "Category") {
      const records = await Category.find({ ...filter });
      return res.json(records);
    }

    if (dataType === "Service") {
      const query = {
        ...filter,
       
        isDeleted: false    // 👈 Also skip deleted ones
      };
      const records = await Service.find(query);
      return res.json(records);
    }

    res.status(400).json({ message: "Unknown data type." });
  } catch (err) {
    console.error("❌ Failed to fetch records:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.post("/get-available-timeslot", async (req, res) => {
const { calendarId, date, serviceDuration } = req.body;

if (!calendarId || !date || !serviceDuration) {
  return res.status(400).json({ message: "Missing data" });
}


  console.log("📥 Incoming timeslot request:", { calendarId, date, serviceDuration });

  try {
    // 1. Get availability for this calendar
    const { calendarId, date, serviceDuration } = req.body;
const calendarObjectId = new mongoose.Types.ObjectId(calendarId);

const availabilityDoc = await WeeklyAvailability.findOne({ calendarId: calendarObjectId }).sort({ createdAt: -1 });

console.log("📋 Found availability:", availabilityDoc);

    if (!availabilityDoc) {
      return res.json({ morning: [], afternoon: [], evening: [] });
    }

    const availability = availabilityDoc.availability; // Array of { day, start, end }
console.log("🧩 Raw availability array from DB:", availability);

const [year, month, day] = date.split("-").map(Number);
const localDate = new Date(year, month - 1, day); // This avoids timezone shifting
const dayOfWeek = localDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
console.log("🗓 Looking for availability on:", dayOfWeek);


console.log("🗓 Looking for availability on:", dayOfWeek);
console.log("🧩 All availability days in DB:", availability.map(a => a.day));

    const dayAvail = availability.find((a) => a.day === dayOfWeek);
    console.log("🗓 Looking for availability on:", dayOfWeek);
console.log("📅 Matched availability:", dayAvail);

    if (!dayAvail || !dayAvail.start || !dayAvail.end) {
      return res.json({ morning: [], afternoon: [], evening: [] });
    }

    // 2. Generate all time slots
    const slots = [];
    const [startH, startM] = dayAvail.start.split(":").map(Number);
    const [endH, endM] = dayAvail.end.split(":").map(Number);

   const duration = parseInt(serviceDuration) || 30;

    const start = new Date(`${date}T${dayAvail.start}`);
    const end = new Date(`${date}T${dayAvail.end}`);

    console.log("🧪 Slot generation check:");
console.log("Start:", start);
console.log("End:", end);
console.log("Duration:", duration);
console.log("Is start < end?", start < end);

    let curr = new Date(start);
    while (curr < end) {
      const hours = curr.getHours().toString().padStart(2, "0");
      const minutes = curr.getMinutes().toString().padStart(2, "0");
      slots.push(`${hours}:${minutes}`);
      curr.setMinutes(curr.getMinutes() + duration);
    }

    // 3. Divide slots into morning / afternoon / evening
    const morning = slots.filter((t) => parseInt(t.split(":")[0]) < 12);
    const afternoon = slots.filter((t) => {
      const hour = parseInt(t.split(":")[0]);
      return hour >= 12 && hour < 17;
    });
    const evening = slots.filter((t) => parseInt(t.split(":")[0]) >= 17);

    res.json({ morning, afternoon, evening, debug: { slots, dayAvail, start, end, duration } });

  } catch (err) {
    console.error("Error getting timeslots:", err);
    res.status(500).json({ message: "Server error getting timeslots" });
  }
});

   //Booking Page Page
                              app.get("/public/service/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json(service);
  } catch (err) {
    console.error("❌ Public service fetch failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Helper functions
function timeToMinutes(timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

// ✅ Availability timeslot endpoint
function timeToMinutes(timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

const isTimeConflict = (startA, endA, startB, endB) => {
  return startA < endB && startB < endA;
};

app.post("/get-available-timeslots", async (req, res) => {
  const { calendarId, date, fullService } = req.body;

  console.log("➡️ Request for available slots for:", { calendarId, date, serviceDuration: fullService?.duration });

  if (!calendarId || !date || !fullService?.duration) {
    return res.status(400).json({ message: "Missing data" });
  }

  const serviceDuration = fullService.duration;
  const [year, month, day] = date.split("-").map(Number);

  try {
    const queryCalendarId = new mongoose.Types.ObjectId(calendarId);

    // Step 1: Check UpcomingHours for that exact date
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

const upcomingOverride = await UpcomingHours.findOne({
  calendarId: queryCalendarId,
  date: date // direct string match
});


    console.log("🧪 Checking upcomingOverride:", upcomingOverride);

    if (!upcomingOverride || !upcomingOverride.isAvailable) {
      console.log("🚫 No upcoming availability found.");
      return res.json([]); // No slots if unavailable or not found
    }

    const startTime = upcomingOverride.start; // e.g., "1:00 AM"
    const endTime = upcomingOverride.end;     // e.g., "4:00 AM"

    // Step 2: Convert to Date objects
    const convertTo24Hour = (timeStr) => {
      const [time, modifier] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);

      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      return { hours, minutes };
    };

    const startParts = convertTo24Hour(startTime);
    const endParts = convertTo24Hour(endTime);

    const start = new Date(year, month - 1, day, startParts.hours, startParts.minutes);
    const end = new Date(year, month - 1, day, endParts.hours, endParts.minutes);

    // Step 3: Generate 15-min slots between start and end
    const slots = [];
    let current = new Date(start);

    while (current.getTime() + serviceDuration * 60000 <= end.getTime()) {
      const hour = current.getHours() % 12 || 12;
      const min = String(current.getMinutes()).padStart(2, "0");
      const ampm = current.getHours() >= 12 ? "PM" : "AM";
      slots.push(`${hour}:${min} ${ampm}`);
      current = new Date(current.getTime() + 15 * 60000);
    }

    // Step 4: Filter out conflicts with existing appointments
    const appointments = await Appointment.find({
      calendarId: queryCalendarId,
      appointmentDate: date,
      isDeleted: { $ne: true }
    });

    console.log(`📆 Found ${appointments.length} appointments for ${date}`);

    const isTimeConflict = (startA, endA, startB, endB) => {
      return startA < endB && startB < endA;
    };

    const availableSlots = slots.filter(slot => {
      const [time, ampm] = slot.split(" ");
      let [h, m] = time.split(":").map(Number);
      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;

      const slotStart = new Date(year, month - 1, day, h, m);
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

      return !appointments.some(app => {
        const [appH, appM] = app.appointmentTime.split(":").map(Number);
        const appStart = new Date(year, month - 1, day, appH, appM);
        const appEnd = new Date(appStart.getTime() + app.duration * 60000);
        return isTimeConflict(slotStart, slotEnd, appStart, appEnd);
      });
    });

    console.log("🟢 Final available slots:", availableSlots);
    res.json(availableSlots);

  } catch (err) {
    console.error("❌ Error in get-available-timeslots:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});





//Availability Page 
app.post("/save-weekly-availability", async (req, res) => {
  const { businessId, calendarId, availability } = req.body;
  const userId = req.session.userId;

  if (!userId) return res.status(401).json({ message: "Not logged in" });
  if (!businessId || !calendarId || !Array.isArray(availability)) {
    return res.status(400).json({ message: "Missing required data" });
  }

  try {
    await WeeklyAvailability.findOneAndUpdate(
      { calendarId, businessId, createdBy: userId },
      { calendarId, businessId, availability, createdBy: userId },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Availability saved" });
  } catch (err) {
    console.error("❌ Error saving weekly availability:", err);
    res.status(500).json({ message: "Failed to save" });
  }
});

app.get("/get-weekly-availability", async (req, res) => {
  const userId = req.session.userId;
  const { calendarId, businessId } = req.query;

  if (!userId) return res.status(401).json({ message: "Not logged in" });
  if (!calendarId || !businessId) {
    return res.status(400).json({ message: "Missing required query parameters" });
  }

  try {
    const entry = await WeeklyAvailability.findOne({
      calendarId,
      businessId,
      createdBy: userId
    });

    if (!entry) {
      return res.json({ availability: [] });
    }

    res.json({ availability: entry.availability });
  } catch (err) {
    console.error("Error fetching weekly availability:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//Upcoming hours


app.post("/get-availability", async (req, res) => {
  const { businessId, calendarId } = req.body;

  if (!businessId || !calendarId) {
    return res.status(400).json({ message: "Missing businessId or calendarId" });
  }

  try {
    const availability = await Availability.findOne({ businessId, calendarId }).sort({ createdAt: -1 });
    if (!availability) {
      return res.status(404).json({ message: "No availability found" });
    }

    res.json({ availability: availability.availability }); // send just the array
  } catch (err) {
    console.error("❌ Error fetching availability:", err);
    res.status(500).json({ message: "Server error" });
  }
});
console.log("✅ /book-appointment route loaded");




app.post("/book-appointment", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: "Not logged in" });

 const {
  businessId,
  calendarId,
  serviceId,
  appointmentDate,
  appointmentTime,
  duration,
  serviceName,
  note,
  clientId, // from dropdown
  clientEmail,
  clientFirstName,
  clientLastName,
  clientPhone
} = req.body;

try {
  let finalClientId = clientId;

  // 🧠 If no clientId was selected, fallback to new client creation logic
  if (!finalClientId && clientEmail) {
    let clientUser = await User.findOne({ email: clientEmail });

    // 1️⃣ If no user exists, create one
    if (!clientUser) {
      const tempPassword = crypto.randomBytes(4).toString("hex");
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      clientUser = await User.create({
        email: clientEmail,
        firstName: clientFirstName,
        lastName: clientLastName,
        phone: clientPhone || "",
        password: hashedPassword,
        role: "client",
        needsPasswordReset: true
      });

      console.log("🧑‍💻 New client user created:", clientUser._id);

      const business = await Record.findById(businessId);
      const businessName = business?.values?.businessName || "SUITESEAT";

      await resend.emails.send({
        from: "appointments@suiteseat.io",
        to: clientEmail,
        subject: `Welcome to SUITESEAT — Your Appointment with ${businessName}`,
        html: `
          <h2>Hi ${clientFirstName} 👋</h2>
          <p>An account has been created for you on SuiteSeat.</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p>You can log in at: <a href="https://yourapp.com/login">yourapp.com/login</a></p>
          <p>Once logged in, you'll be asked to change your password.</p>
          <hr/>
          <h3>Your Appointment Details:</h3>
          <p><strong>Service:</strong> ${serviceName}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentTime}</p>
          <p><strong>Duration:</strong> ${duration} minutes</p>
          <p><strong>Note:</strong> ${note || "N/A"}</p>
        `
      });
    } else {
      console.log("👀 Client already has an account:", clientUser._id);
    }

    // 2️⃣ Ensure they have a Client record too
    let client = await Client.findOne({
      createdBy: userId,
      businessId,
      email: clientEmail
    });

    if (!client) {
      client = await Client.create({
        createdBy: userId,
        businessId,
        firstName: clientFirstName,
        lastName: clientLastName,
        email: clientEmail,
        phone: clientPhone || ""
      });
    }

    finalClientId = client._id;
  }

  if (!finalClientId) {
    return res.status(400).json({ message: "Missing client information." });
  }

  // 3️⃣ Create Appointment
  const appointment = await Appointment.create({
    createdBy: userId,
    clientId: finalClientId,
    businessId,
    calendarId,
    serviceId,
    appointmentDate,
    appointmentTime,
    duration,
    serviceName,
    note: note || "",
    clientName: `${clientFirstName} ${clientLastName || ""}`.trim()
  });

  res.status(200).json({ message: "Appointment booked!", appointment });

} catch (err) {
  console.error("❌ Error booking appointment:", err);
  res.status(500).json({ message: "Booking failed" });
}

});


//Send email when an appointment is booked to create an account as a client 

//Send email the day before appointment 
const cron = require("node-cron");



// ⏰ Run daily at 9:00 AM
cron.schedule("0 9 * * *", async () => {
  console.log("📅 Running daily reminder email task...");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const dd = String(tomorrow.getDate()).padStart(2, "0");
  const dateString = `${yyyy}-${mm}-${dd}`;

  try {
    const appointments = await Appointment.find({
      appointmentDate: dateString,
      isDeleted: false,
    });

    for (const appt of appointments) {
      const client = await Client.findById(appt.clientId);
      if (!client || !client.email) continue;

      const subject = `Reminder: Your Appointment is Tomorrow at ${appt.appointmentTime}`;
      const html = `
        <h3>Hey ${client.firstName}, just a reminder!</h3>
        <p><strong>Service:</strong> ${appt.serviceName}</p>
        <p><strong>Date:</strong> ${appt.appointmentDate}</p>
        <p><strong>Time:</strong> ${appt.appointmentTime}</p>
        <p><strong>Duration:</strong> ${appt.duration} minutes</p>
        <br/>
        <p>See you tomorrow!</p>
      `;

      await resend.emails.send({
        from: "reminders@suiteseat.io",
        to: client.email,
        subject,
        html,
      });

      console.log("📨 Reminder sent to:", client.email);
    }

    console.log("✅ All reminders processed.");
  } catch (err) {
    console.error("❌ Reminder job failed:", err);
  }
});




//reset password 
// Store tokens temporarily (or you can store in DB)
let resetTokens = {}; // If not already at top of file

app.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!resetTokens[token]) {
    return res.status(400).json({ message: "Invalid or expired token." });
  }

  const userId = resetTokens[token];

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    delete resetTokens[token]; // Invalidate token
    res.json({ message: "✅ Password has been reset." });
  } catch (err) {
    console.error("❌ Error resetting password:", err);
    res.status(500).json({ message: "Server error" });
  }
});


















                                //  Routes 

 //Delete this 
app.get('/1wholecode',(req, res) => {
    res.sendFile(path.join(__dirname, 'views', '1wholecode.html'));
  });
                                //Datatype page 
app.get('/datatype2',(req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'datatype2.html'));
  });
                                //Calendar2 page 
app.get('/accept', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'accept.html'));
});
app.get("/slug", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "slug.html"));
});

app.get("/apage", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "apage.html"));
});

app.get("/game", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "game.html"));
});
app.get("/apage2", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "apage2.html"));
});

app.get("/newpage", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "newpage.html"));
});

//Index Page 
app.get('/',(req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
  }); 
  
//Datatype page 
app.get('/datatype',(req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'datatype.html'));
  });

  //Signup page 
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

//Business Settings page 
app.get('/business-settings', ensureAuthenticated,(req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'business-settings.html'));
});

//Accept Appointments page 
app.get('/accept-appointments', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'accept-appointments.html'));
});




// Availability Page
app.get('/availability', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'availability.html'));
});


//Calendar2 page 
app.get('/calendar2', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'calendar2.html'));
});
//ab-testing page 
app.get('/ab-testing', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'ab-testing.html'));
});

//Client-board page 
app.get('/client-dashboard', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'client-dashboard.html'));
});


//booking-page page 
app.get('/booking-page', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'booking-page.html'));
});

//Test page 
app.get('/test-upload', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'test-upload.html'));
});

                               //Signup Page
// ROUTES
app.get("/testpage", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "testpage.html"));
});


app.get("/reset-password", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "reset-password.html"));
});


app.get("/forgot-password", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "forgot-password.html"));
});

//clients page 
app.get('/clients', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'clients.html'));
});


//menu page 
app.get('/menu', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'menu.html'));
});


//User Sign Up 


//User Sign Up 
app.post("/signup", async (req, res) => {
  const { email, password, firstName, lastName, phone, role } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use.' });

    const newUser = new User({
      email,
      password, // hashed in pre-save hook
      firstName,
      lastName,
      phone,
      role
    });

    await newUser.save();
    req.session.userId = newUser._id;

    // ✅ Send welcome email to clients only
    if (role === 'client') {
      await resend.emails.send({
        from: "SuiteSeat <welcome@suiteseat.io>",
        to: email,
        subject: "Welcome to SuiteSeat 💺✨",
        html: `
      <div style="font-family: sans-serif; padding: 20px; background: #fff3ea; border-radius: 10px;">
  <h1 style="color: #FF6600;">Hey {{firstName}},</h1>
  <p>Welcome to <strong>SuiteSeat</strong> 🎉</p>
  <p>Your stylist can now manage bookings, send you updates, and keep everything in one spot.</p>
  
  <p style="margin-top: 20px;">Tap below to access your dashboard:</p>

  <a href="http://localhost:6400/client-dashboard" 
     style="display: inline-block; padding: 12px 20px; background-color: #efb37c; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
    Go to Dashboard
  </a>

  <p style="margin-top: 30px;">You're officially in! 🧡</p>
</div>

        `
      });
    }

    let redirect = '/';
    if (role === 'admin') redirect = '/datatype';
    else if (role === 'business') redirect = '/business-settings';
    else if (role === 'client') redirect = '/client-dashboard';

    res.status(201).json({ redirect });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error during sign up." });
  }
});

app.get("/test-email", async (req, res) => {
  await resend.emails.send({
    from: "SuiteSeat <welcome@suiteseat.io>",
    to: "your-email@example.com",
    subject: "Test Email",
    html: "<h1>This is a test email from SuiteSeat</h1>"
  });

  res.send("✅ Test email sent!");
});


                               //User Log in 
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // ✅ Save user ID to session
    req.session.userId = user._id;

    // 🔍 Look up Client record if user is a client
    let clientId = null;
    if (user.role === "client") {
      const client = await Client.findOne({ createdBy: user._id });
      if (client) clientId = client._id;
    }

    // ✅ Figure out where to redirect after login
    let redirect = "/";
    if (user.role === "admin") redirect = "/datatype";
    else if (user.role === "business") redirect = "/business-settings";
    else if (user.role === "client") redirect = "/client-dashboard";

    // ✅ Return full data + redirect
    return res.status(200).json({
      message: "Login successful",
      userId: user._id,
      clientId,
      firstName: user.firstName,
      email: user.email,
      role: user.role,
      redirect // 👈 Add this too
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

                        
// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("❌ Logout failed:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid"); // this is important
    res.json({ message: "Logged out" });
  });
  
});
app.get("/check-login", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.json({ loggedIn: false });

  const user = await User.findById(userId);
  if (!user) return res.json({ loggedIn: false });

  // ✅ Get clientId (if role is client or has matching email)
  let clientId = null;
  const client = await Client.findOne({
    $or: [
      { userId },
      { email: user.email }
    ]
  });

  if (client) {
    clientId = client._id.toString();
  }

  res.json({
    loggedIn: true,
    userId,
    clientId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || "",
    profilePhoto: user.profilePhoto || "/uploads/default-avatar.png", // ✅ Add this line
    role: user.role,
    lastSelectedBusinessId: user.lastSelectedBusinessId || null,
  });
});

//Reset Password
  app.post("/change-password", async (req, res) => {
  const userId = req.session.userId;
  const { currentPassword, newPassword } = req.body;

  if (!userId) return res.status(401).json({ message: "Not logged in" });

  try {
    const user = await User.findById(userId);
    const match = await bcrypt.compare(currentPassword, user.password);

    if (!match) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    user.password = hashedNew;
    await user.save();

    res.json({ message: "Password updated" });
  } catch (err) {
    console.error("❌ Change password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});                   





                 //Email
// ✅ BEST VERSION — KEEP THIS
app.post("/request-password-reset", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.json({ message: "If the email exists, a reset link was sent." }); // Don't reveal valid emails
  }

  // Generate a secure token
  const token = crypto.randomBytes(32).toString("hex");

  // Save token + expiry to user
  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 1000 * 60 * 30; // 30 minutes
  await user.save();

  // Create reset URL
  const resetUrl = `http://localhost:6400/reset-password/${token}`;

  // Send email via Resend
  try {


    res.json({ message: "If the email exists, a reset link was sent." });
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    res.status(500).json({ message: "Error sending email" });
  }
});




app.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).send("Invalid or expired token.");
  }

  // ✅ Serve your reset-password.html page here
  res.sendFile(path.join(__dirname, 'public/reset-password.html'));
});

app.post('/update-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();

  res.json({ message: "Password updated successfully" });
});


































// This route goes LAST after all your real pages are defined
const fs = require("fs");

app.get("/:slug", async (req, res) => {
  const slug = req.params.slug;
  try {
    const business = await Business.findOne({ slug });
    if (!business) return res.status(404).send("Business not found");

    res.render("booking-page", { slug, business });
  } catch (err) {
    console.error("Error loading slug page:", err);
    res.status(500).send("Server error");
  }
});




app.use(express.static(path.join(__dirname, 'public')));


app.use('/api', router);  // Make sure the router is being used in your app

const http = require("http");
const socketIO = require("socket.io");

const server = http.createServer(app);  // ✅ create the server first
const io = socketIO(server, {
  cors: {
    origin: "*", // or your frontend URL
  }
});

app.set("socketio", io); // ✅ store io so routes can access it

// ✅ Now safely use io after it's defined
io.on("connection", (socket) => {
  console.log("🔌 A client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ✅ Start the server after everything is ready
const PORT = process.env.PORT || 6400;
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket.IO running at http://localhost:${PORT}`);
});
