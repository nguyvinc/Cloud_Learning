const router = require('express').Router();
const validation = require('../lib/validation');
const mysqlPool = require('../lib/mysqlPool');

const businesses = require('../data/businesses');
const { reviews } = require('./reviews');
const { photos } = require('./photos');

exports.router = router;
exports.businesses = businesses;

/*
 * Schema describing required/optional fields of a business object.
 */
const businessSchema = {
  ownerid: { required: true },
  name: { required: true },
  address: { required: true },
  city: { required: true },
  state: { required: true },
  zip: { required: true },
  phone: { required: true },
  category: { required: true },
  subcategory: { required: true },
  website: { required: false },
  email: { required: false }
};

/*
 * Route to return a list of businesses.
 */
router.get('/', async (req, res) => {
  try{
    const businessesPage = await getBusinessesPage((req.query.page || 1));
    res.status(200).send(businessesPage);
  }
  catch (err){
    console.error("== Error:", err);
    res.status(500).send({
      err: "Error fetching business list."
    });
  }
});

async function getBusinessCount(){
  const [results, fields] = await mysqlPool.query(
    "SELECT COUNT(*) AS count FROM Businesses;"
  );
  console.log("== Fields:", fields);
  return results[0].count;
}

async function getBusinessesPage(page){
  /*
   * Compute page number based on optional query string parameter `page`.
   * Make sure page is within allowed bounds.
   */
  const numPerPage = 10;
  const numBusinesses = await getBusinessCount();
  const lastPage = Math.ceil(numBusinesses / numPerPage);
  page = (page < 1) ? 1 : page;
  page = (page > lastPage) ? lastPage : page;

  /*
   * Calculate starting and ending indices of businesses on requested page and
   * slice out the corresponsing sub-array of busibesses.
   */
  const start = (page - 1) * numPerPage;
  const end = start + numPerPage;
  const pageBusinesses = businesses.slice(start, end);

  // Generate HATEOAS links for surrounding pages.
  const links = {};
  if (page < lastPage) {
    links.nextPage = `/businesses?page=${page + 1}`;
    links.lastPage = `/businesses?page=${lastPage}`;
  }
  if (page > 1) {
    links.prevPage = `/businesses?page=${page - 1}`;
    links.firstPage = '/businesses?page=1';
  }

  // Get all businesses from corresponding page
  const offset = (page-1) * numPerPage;
  const [results] = await mysqlPool.query(
    "SELECT * FROM `Businesses` ORDER BY `id` ASC LIMIT ?, ?;",
    [offset, numPerPage]
  );

  return {
    businesses: results,
    page: page,
    totalPages: lastPage,
    pageSize: numPerPage,
    count: numBusinesses
  };
}



/*
 * Route to create a new business.
 */
router.post('/', async (req, res, next) => {
  if (validation.validateAgainstSchema(req.body, businessSchema)) {
    const business = validation.extractValidFields(req.body, businessSchema);
    const newId = await postBusiness(business);
    res.status(201).json({
      id: newId,
      links: {
        business: `/businesses/${newId}`
      }
    });
  } else {
    res.status(400).json({
      error: "Request body is not a valid business object"
    });
  }
});

async function postBusiness(body){
  await mysqlPool.query(
    "INSERT INTO `Businesses` (`ownerId`, `name`, `address`, `city`, `state`, `zip`, `phone`, `category`, `subcategory`, `website`, `email`)" +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
    [body.ownerid, body.name, body.address, body.city, body.state, body.zip, body.phone, body.category, body.subcategory, body.website, body.email]
  );

  const [results] = await mysqlPool.query(
    "SELECT LAST_INSERT_ID() AS id;"
  );
  return results[0].id;
}



/*
 * Route to fetch info about a specific business.
 */
router.get('/:businessid', function (req, res, next) {
  const businessid = parseInt(req.params.businessid);
  if (businesses[businessid]) {
    /*
     * Find all reviews and photos for the specified business and create a
     * new object containing all of the business data, including reviews and
     * photos.
     */
    const business = {
      reviews: reviews.filter(review => review && review.businessid === businessid),
      photos: photos.filter(photo => photo && photo.businessid === businessid)
    };
    Object.assign(business, businesses[businessid]);
    res.status(200).json(business);
  } else {
    next();
  }
});

/*
 * Route to replace data for a business.
 */
router.put('/:businessid', function (req, res, next) {
  const businessid = parseInt(req.params.businessid);
  if (businesses[businessid]) {

    if (validation.validateAgainstSchema(req.body, businessSchema)) {
      businesses[businessid] = validation.extractValidFields(req.body, businessSchema);
      businesses[businessid].id = businessid;
      res.status(200).json({
        links: {
          business: `/businesses/${businessid}`
        }
      });
    } else {
      res.status(400).json({
        error: "Request body is not a valid business object"
      });
    }

  } else {
    next();
  }
});

/*
 * Route to delete a business.
 */
router.delete('/:businessid', function (req, res, next) {
  const businessid = parseInt(req.params.businessid);
  if (businesses[businessid]) {
    businesses[businessid] = null;
    res.status(204).end();
  } else {
    next();
  }
});