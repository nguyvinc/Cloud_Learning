/*
 * API sub-router for businesses collection endpoints.
 */

const router = require('express').Router();
const {requireAuthentication} = require("../models/users");

const { validateAgainstSchema } = require('../lib/validation');
const {
  BusinessSchema,
  getBusinessesPage,
  insertNewBusiness,
  getBusinessDetailsById,
  replaceBusinessById,
  deleteBusinessById,
  getBusinessesByOwnerdId
} = require('../models/business');

/*
 * Route to return a paginated list of businesses.
 */
router.get('/', async (req, res) => {
  try {
    /*
     * Fetch page info, generate HATEOAS links for surrounding pages and then
     * send response.
     */
    const businessPage = await getBusinessesPage(parseInt(req.query.page) || 1);
    businessPage.links = {};
    if (businessPage.page < businessPage.totalPages) {
      businessPage.links.nextPage = `/businesses?page=${businessPage.page + 1}`;
      businessPage.links.lastPage = `/businesses?page=${businessPage.totalPages}`;
    }
    if (businessPage.page > 1) {
      businessPage.links.prevPage = `/businesses?page=${businessPage.page - 1}`;
      businessPage.links.firstPage = '/businesses?page=1';
    }
    res.status(200).send(businessPage);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Error fetching businesses list.  Please try again later."
    });
  }
});

/*
 * Route to create a new business.
 */
router.post('/', requireAuthentication, async (req, res) => {
  if(req.user){
    if(validateAgainstSchema(req.body, BusinessSchema)) {
      try {
        const id = await insertNewBusiness(req.body, req.user, req.admin);
        if(id){
          res.status(201).send({
            id: id,
            links: {
              business: `/businesses/${id}`
            }
          });
        }
        else{
          res.status(400).send({
            error: "Unable to create business."
          });
        }
      } 
      catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Error inserting business into DB.  Please try again later."
        });
      }
    } else {
      res.status(400).send({
        error: "Request body is not a valid business object."
      });
    }
  }
  else{
    res.status(403).send({
      error: "Only authorized users can add businesses."
    });
  }
});

/*
 * Route to fetch info about a specific business.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const business = await getBusinessDetailsById(parseInt(req.params.id));
    if (business) {
      res.status(200).send(business);
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch business.  Please try again later."
    });
  }
});

/*
 * Route to replace data for a business.
 */
router.put('/:id', requireAuthentication, async (req, res, next) => {
  if (validateAgainstSchema(req.body, BusinessSchema)) {
    try {
      const id = parseInt(req.params.id)
      const updateSuccessful = await replaceBusinessById(id, req.body, req.user, req.admin);
      if(updateSuccessful.error){
        res.status(401).send({
          error: "User is not authorized to update the selected business."
        })
      }
      else if(updateSuccessful) {
        res.status(200).send({
          links: {
            business: `/businesses/${id}`
          }
        });
      }
      else {
        next();
      }
    }
    catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to update specified business.  Please try again later."
      });
    }
  }
  else {
    res.status(400).send({
      error: "Request body is not a valid business object"
    });
  }
});

/*
 * Route to delete a business.
 */
router.delete('/:id', requireAuthentication, async (req, res, next) => {
  try {
    const deleteSuccessful = await deleteBusinessById(parseInt(req.params.id), req.user, req.admin);
    if(deleteSuccessful.error){
      res.status(401).send({
        error: "User is not authorized to delete the selected business."
      });
    }
    else if (deleteSuccessful) {
      res.status(204).end();
    }
    else {
      next();
    }
  }
  catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to delete business.  Please try again later."
    });
  }
});

module.exports = router;
