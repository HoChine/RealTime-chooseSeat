$(function(){
    var price = 100; //电影票价
    var initData = {
        socket: io.connect('http://localhost:3000'),
        mapData:[ //座位结构图 a 代表座位; 下划线 "_" 代表过道
            'cccccccccc',
            'cccccccccc',
            '__________',
            'cccccccc__',
            'cccccccccc',
            'cccccccccc',
            'cccccccccc',
            'cccccccccc',
            'cccccccccc',
            'cc__cc__cc'
        ],
        iconStatus:[    // 座位状态
            ['c', 'available', '可选座'],
            ['c', 'selected', '已选中'],
            ['c', 'locking', '已锁定'],
            ['c', 'unavailable', '已售出'],
        ],
        selectedSeat:{}  
    }


    var interaction = {
        initMap:function(){
            var _this = this;
            var $cart = $('#seats_chose'), //座位区
                $tickects_num = $('#tickects_num'), //票数
                $total_price = $('#total_price'); //票价总额
            var sc = $('#seat_area').seatCharts({
                map:initData.mapData,
                naming: { //设置行列等信息
                    top: false, //不显示顶部横坐标（行） 
                    getLabel: function(character, row, column) { //返回座位信息 
                        return column;
                    }
                },
                legend: { //定义图例
                    node: $('#legend'),
                    items: initData.iconStatus
                },
                click: function() {
                    if (this.status() == 'available') { //若为可选座状态，添加座位
                        $('<li>' + (this.settings.row + 1) + '排' + this.settings.label + '座</li>')
                            .attr('id', 'cart-item-' + this.settings.id)
                            .data('seatId', this.settings.id)
                            .appendTo($cart);
                        $tickects_num.text(sc.find('selected').length + 1); //统计选票数量
                        $total_price.text(_this.getTotalPrice(sc) + price); //计算票价总金额

                        // 向服务器发送消息，座位被我选中
                        _this.emit("selected",{
                            firetype:'selected',
                            firetime:new Date().toLocaleString(),
                            character:this.settings.character,
                            column:this.settings.column,
                            data:this.settings.data,
                            id:this.settings.id,
                            label:this.settings.label,
                            row:this.settings.row
                        })
                        initData.selectedSeat[this.settings.id] = this.settings;
                        return 'selected';
                    } else if (this.status() == 'selected') { //若为选中状态
                        $tickects_num.text(sc.find('selected').length - 1); //更新票数量
                        $total_price.text(_this.getTotalPrice(sc) - price); //更新票价总金额
                        $('#cart-item-' + this.settings.id).remove(); //删除已预订座位

                        // 向服务器发送消息，座位被我取消
                        _this.emit("cancleselected",{
                            firetype:'cancleselected',
                            firetime:new Date().toLocaleString(),
                            character:this.settings.character,
                            column:this.settings.column,
                            data:this.settings.data,
                            id:this.settings.id,
                            label:this.settings.label,
                            row:this.settings.row
                        })
                        delete initData.selectedSeat[this.settings.id];
                        return 'available';
                    } else if (this.status() == 'unavailable') { //若为已售出状态
                        return 'unavailable';
                    } else {
                        return this.style();
                    }
                }
            });
            //设置已售出的座位
            sc.get(['1_3', '1_4', '4_4', '4_5', '4_6', '4_7', '4_8']).status('unavailable'); 
            interaction.commitSeat();
        },
        getTotalPrice:function(sc){//计算票价总额
            var total = 0;
            sc.find('selected').each(function() {
                total += price;
            });
            return total;
        },
        emit:function(type,msg){
           initData.socket.emit(type,msg); 
        },
        socketEvent:function(){
            this.emit("login","用户进入选座页面")
            initData.socket.on("loginlock",function(loginlock){
                for(var t in loginlock){
                    var isMine = interaction.isMineFire(t,"selected");
                    if (!isMine) {
                       $('#'+t).addClass("locking");  
                    }
                }    
            })

            initData.socket.on("locking",function(data){
                var isMine = interaction.isMineFire(data.id,"selected");
                if (!isMine) {
                    $('#'+data.id).addClass("locking")
                }
            })
            initData.socket.on("canclelocking",function(data){
                $('#'+data.id).removeClass("locking"); 
            })
            initData.socket.on("userout",function(outuser){
                // outuser 为退出用户所选择的座位。
                for(var t in outuser){
                    $('#'+t).removeClass("locking"); 
                }
            })
            initData.socket.on("seatsold",function(soldseat){
                // soldseat 为用户已经购买的座位。  客户端更新座位状态
                $.each(soldseat,function(index,item){
                    $('#'+item).addClass('unavailable');
                })
            })

            
        },
        isMineFire:function(id,type){
            return  $('#'+id).attr('class').indexOf(type) > 0;
        },
        commitSeat:function(){
            $("#commitSeat").click(function(){
                if (JSON.stringify(initData.selectedSeat) === "{}") {
                    alert("请至少选择一个座位再提交！")
                    return false;
                }
                //$.post("http://XXXXXXXX",座位数据,function(){
                // 延迟2秒模拟生成订单的ajax请求,请求成功跳转订单页。
                setTimeout(function() {
                    interaction.emit("sold",initData.selectedSeat);
                    location.href = "/order";
                }, 2000);
                //})
            })
        }
    }
    interaction.initMap();
    interaction.socketEvent();  
})










