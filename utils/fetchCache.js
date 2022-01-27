import lscache from "lscache";

export default (url, timeout) => {
    const data = lscache.get(url);

    if(data) {
        return Promise.resolve(data);
    } else {
        return $.ajax({
            dataType: "json",
            url: (url),
            success: function (res) {
                lscache.set(url, res, timeout);
                return res
            }
        }); 
    }
}