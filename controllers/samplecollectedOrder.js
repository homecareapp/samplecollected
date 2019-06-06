var mongoose = require('mongoose');
var async = require('async');

var Model = require('../models/Order');

function update(params, callback){
	var prescriptions = [], logistic = {}, log = [], comments= [], order={};
	function getOrder(next) {
		Model.findById(params.id,{}, { lean:true }, function(e,r){
			if(e) return next(e);
			if(!r.prescriptions) r.prescriptions = [];
			prescriptions = r.prescriptions; // array - push
			visitcomments = r.visitcomments; // array - replace
			log = r.log;
			statuslog = r.statuslog;
			paymentdetails = r.paymentdetails;
			//visitingcharges = r.paymentdetails.visitingcharges; // string - replace
			//reportdeliverymode = r.paymentdetails.reportdeliverymode; //array - replace
			order = r
			return next(null);
		});
	}

	function updateOrder(next) {
        if(params.updateobj.patientSignature)
		{
			var sign = false;
	        prescriptions.forEach(function(prep){
	            if(prep.description == "Patient Signature")
	            {
	                sign = true
	            }
	            
	        })

	        if(!sign)
	        {
	            prescriptions.push(params.updateobj.patientSignature);
	            
	        }
		}
		if(params.updateobj.visitcomments) visitcomments = params.updateobj.visitcomments;
		if(params.updateobj.visitingcharges) paymentdetails.visitingcharges = params.updateobj.visitingcharges;
		if(params.updateobj.reportdeliverymode) paymentdetails.reportdeliverymode = params.updateobj.reportdeliverymode;

		if(Array.isArray(log)) 
		{
			var logobj = {};
			logobj.action = "statuschanged"
			logobj.comments = "status updated to completed";
			logobj["oldstatus"] = order.status;
	        logobj["newstatus"] = "SampleCollected";
	        logobj["updatedby"] = params.user_id;
	        logobj["updateddatetime"] = Date();
			log.push(logobj);
		}

		var statusLogObj = {
            status: "SampleCollected",
            statustimestamp: Date(),
            statusby: params.user_id,
            coordinates: params.coordinates
        }

        if(!statuslog) statuslog = [];
        statuslog.push(statusLogObj);


		var updateobj = {
			prescriptions: prescriptions,
			status:"SampleCollected",
			visitcomments: visitcomments,
			paymentdetails:paymentdetails,
			log: log,
			statuslog:statuslog
		}
		Model.update({"_id":params.id},{ $set:updateobj }, function(e,r){
			if(e) return next(e);
			//update pporder
			getPPOrder(params.id, function(e, pporder){
				if(e) return next(e);
				if(!pporder) return next(null);
                visitcomments.forEach(function(visitcomm)
                {
					if (visitcomm)
                    {
                        var arr = visitcomm.split(':');
                        var a = (arr[0].toUpperCase()).trim()
                        if((a.toUpperCase()).trim() != 'SINGLE PRICK' && (a.toUpperCase()).trim() != 'DOUBLE PRICK' && (a.toUpperCase()).trim() != 'RESCUE PRICK')
                        {
                            if(!pporder.visitcomments)
                            {
                                pporder.visitcomments = [];
                            }
                            pporder.visitcomments.push("Fasting comments : "+visitcomm)
                        }
                    }
                })
				pporder.paymentdetails.reportdeliverymode = paymentdetails.reportdeliverymode;
				for (var i = 0; i < pporder.paymentdetails.reportdeliverymode.length; i++) {
                    if(pporder.paymentdetails.reportdeliverymode[i].charge)
                    {
                        pporder.paymentdetails.reportdeliverymode[i].charge = 0
                    }
                }
                pporder.prescriptions = [];

                pporder.save(function(e, ppresult) {
                	if(e) return next(e);
                	return next(null);
                })    
            })
            //update pporder
			
		});
	}

	async.waterfall([getOrder, updateOrder], function(e){
		if(e) return callback(e);
		return callback(null)
	});
}

function getPPOrder(parentId, callback) {
    // If Order type is fasting show   
    var search = {
        ordertype: "PP",
        parentorder_id: parentId,
        status:{$ne:"Cancelled"}
    }
    Model.findOne(search,{fromtime:1,fromdate:1,servicedeliveryaddress:1,orderGroupId:1,status:1, services:1},function(error, ppOrder) {
        if (error) return callback(error);

        return callback(null, ppOrder)           
    })
   
}

exports.update = update;