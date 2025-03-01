// function asyncWrap(fn){
//     return function(req,res,next){
//         fn(req, res, next).catch(next);
//     }
// }
// module.exports=asyncWrap;

function asyncWrap(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
module.exports = asyncWrap;
