var express = require('express');
var router = express.Router();
var passportConf = require('../config/passport');
var order = require('../controllers/samplecollectedOrder');


router.put('/samplecollected/:id', passportConf.isAuthorized, function(req,res,next){
    var params = req.body;
    params.id = req.params.id;
    params.user_id = req.user._id;

    if(!params.updateobj) return next(new Error("updateobj missing"));
    //if(!params.updateobj.visitcomments) return next(new Error("visit comment missing"));
    if(!params.updateobj.patientSignature) return next(new Error("signature missing"));
    if(params.updateobj.visitingcharges == undefined) return next(new Error("visitingcharges missing"));
    if(!params.updateobj.reportdeliverymode) return next(new Error("reportdeliverymode missing"));

    //if(!params.updateobj.comments) return next(new Error("comments missing"));

	
	order.update(params, function(e, r){
		if(e) return next(e);
		return res.json({response:"Sample collected"});
	});
});

module.exports = router;