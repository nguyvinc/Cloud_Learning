const router = require('express').Router();
const validation = require('../lib/validation');
const mysqlPool = require('../lib/mysqlPool');

exports.router = router;

/*
 * Schema describing required/optional fields of a business object.
 */
const businessSchema = {
  ownerId: { required: true },
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
    res.status(500).send({
      err: "Error fetching business list."
    });
  }
});

async function getBusinessCount(){
  const [results, fields] = await mysqlPool.query(
    "SELECT COUNT(*) AS count FROM Businesses;"
  );
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
    const newId = await postBusiness(req.body);
    if(newId){
      res.status(201).json({
        id: newId,
        links: {
          business: `/businesses/${newId}`
        }
      });
    }
    else{
      res.status(500).send({
        error: "Error inserting business. Please try again."
      })
    }
  } 
  else {
    res.status(400).json({
      error: "Request body is not a valid business object"
    });
  }
});

async function postBusiness(business){
  const validatedBusiness = validation.extractValidFields(business, businessSchema);
  const [results] = await mysqlPool.query(
    "INSERT INTO `Businesses` SET ?;",
    validatedBusiness
  );
  return results.insertId;
}



/*
 * Route to fetch info about a specific business.
 */
router.get('/:businessid', async (req, res, next) => {
  try{
    const businessId = parseInt(req.params.businessid);
    const businessInfo = await getSingleBusiness(businessId);
    if(businessInfo.business){
      res.status(200).send(businessInfo);
    }
    else{
      next();
    }
  }
  catch(err){
    res.status(500).send({
      error: "Unable to fetch business."
    });
  }
});

async function getSingleBusiness(id){
  const [reviews] = await mysqlPool.query(
    "SELECT * FROM `Reviews`" +
    "WHERE `Reviews`.`businessId`=?;",
    [id]
  );
  const [photos] = await mysqlPool.query(
    "SELECT * FROM `Photos`" +
    "WHERE `Photos`.`businessId`=?;",
    [id]
  );
  const [business] = await mysqlPool.query(
    "SELECT * FROM `Businesses`" +
    "WHERE `Businesses`.`id`=?;",
    [id]
  );
  return {
    business: business[0],
    reviews: reviews,
    photos: photos
  };
}



/*
 * Route to replace data for a business.
 */
router.put('/:businessid', async (req, res, next) => {
  try {
    const id = parseInt(req.params.businessid);
    if (validation.validateAgainstSchema(req.body, businessSchema)) {
      const updatedId = await updateBusiness(req.body, id);
      if(updatedId){
        res.status(200).json({
          links: {
            business: `/businesses/${id}`
          }
        });
      }
      else{
        next();
      }
    } 
    else {
      res.status(400).send({
        error: "Request body is not a valid business object"
      });
    }
  }
  catch(err) {
    res.status(500).send({
      error: "Business could not be updated. Please try again."
    });
  }
});

async function updateBusiness(body, id){
  const validatedBusiness = validation.extractValidFields(body, businessSchema);
  const [results] = await mysqlPool.query(
    "UPDATE `Businesses` SET ? WHERE `id`=?;",
    [validatedBusiness, id]
  );
  return results.affectedRows > 0;
}



/*
 * Route to delete a business.
 */
router.delete('/:businessid', async (req, res, next) => {
  try{
    const businessId = parseInt(req.params.businessid);
    const deleteSuccess = await deleteBusiness(businessId);
    if (deleteSuccess) {
      res.status(204).end();
    }
    else {
      next();
    }
  }
  catch (err){
    res.status(500).send({
      error: "Error deleting business. Please try again."
    });
  }
});

async function deleteBusiness(id){
  const [results] = await mysqlPool.query(
    "DELETE FROM `Businesses` WHERE `id` = ?;",
    id
  );
  return results.affectedRows > 0;
}