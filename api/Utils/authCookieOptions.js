const getJwtCookieOptions = (isInProd) => ({
    httpOnly: true,
    secure: isInProd,
    sameSite: isInProd ? 'None' : 'Lax',
    ...(isInProd ? { domain: 'plateforme-ged.com', path: '/' } : {})
});
 
module.exports = { getJwtCookieOptions };