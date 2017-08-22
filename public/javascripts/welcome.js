(function () {
    "use strict"
    let janusId = null;
    let sessionId = null;
    let roomTable = null;
    $.ajax({
        url: './createJanus',
        type: 'post',
        data: {
            transaction: 'das3213b213dd',
            token: "ddzAdmin"
        }
    }).done((respons) => {
        console.log(typeof(respons));
        if (respons.code) {
            janusId = respons.parms.id;
            useVedioRoom();
            keepLive(janusId);
        } else {
            alert(respons.msg);
        }
    }).fail((error) => {
        alert(error.messgae);
    });

    function keepLive(janusId) {
        $.ajax({
            url: './keepLive',
            type: 'post',
            data: {
                janusId: janusId,
                token: "ddzAdmin"
            }
        }).done((respons) => {
            if (respons.code) {
                console.log(respons.parms);
                setTimeout(keepLive, 10 * 1000, janusId);
            } else {
                console.log(respons.msg);
            }
        }).fail((error) => {
            console.log(error.messgae);
        });
    }

    function useVedioRoom() {
        $.ajax({
            url: './usePlugin',
            type: 'post',
            data: {
                janusId: janusId,
                pluginName: "vedioRoom",
                transaction: 'dasdasdsds',
                token: "ddzAdmin"
            }
        }).done((respons) => {
            if (respons.code) {
                sessionId = respons.parms.id;
                roomTable = $('#roomList').DataTable({
                    "ajax": {
                        "url": "./listRoom",
                        "type": "POST",
                        "data": {
                            janusId: janusId,
                            sessionId: sessionId,
                            transaction: 'das3213b213dd'
                        },
                        "dataSrc": "parms"
                    },
                    "columns": [{
                            "data": "room"
                        },
                        {
                            "data": "description"
                        },
                        {
                            "data": "max_publishers"
                        }, {
                            "data": "num_participants"
                        }, {
                            "data": function (e) {
                                const html = '<button class="btn_del" >删除</button>';
                                return html;
                            }
                        }
                    ]
                });
            } else {
                console.log(respons.msg);
            }
        }).fail((error) => {
            console.log(error.messgae);
        });
    }

    $('#roomList').on('click', '.btn_del', function () {
        const data = roomTable.row($(this).parents('tr')).data();
        $.ajax({
            url: './destroyRoom',
            type: 'post',
            data: {
                janusId: janusId,
                sessionId: sessionId,
                roomId: data.room,
                transaction: 'sdasdas'
            },
        }).done(function (respons) {
            if (respons.error) {
                console.log(respons.error);
            } else {
                alert('房间删除成功');
                roomTable.ajax.reload();
            }
        }).fail(function (error) {
            console.log(error);
        });
    });
}());