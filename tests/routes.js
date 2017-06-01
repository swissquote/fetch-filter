module.exports = function(app) {
    app.get("/tests/advanced/test.authorization.json", function(req, res) {
        if (!("x-auth-token" in req.headers)) {
            res.status(403).json({error: "no_auth_token"});
        }

        res.status(200).json({response: "Your settings are saved"});
    })
}
