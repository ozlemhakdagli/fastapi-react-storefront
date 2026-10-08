
        <div class="col-xs-12">
          <div class="box">
            <div class="box-header">
			<h2 align="center" font-weight=" bold">Mesaj Detayı</h2><br>
			  <?php if ($this->session->flashdata('sonuc')) 
			  { ?>
			  <div class="alert alert-success alert-dismissible">
                <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>
                <i class="icon fa fa-check"></i> <?=$this->session->flashdata('sonuc')?>
                
              </div>
			  <?php } ?>
              <form role="form" action="<?=base_url()?>admin/mesajlar/guncellekaydet/<?=$veri[0]->Id?>" method="post"> 
            </div>
            <!-- /.box-header -->
            <div class="box-body table-responsive no-padding">
              <table class="table table-hover" border="1">
			  <thead>
                <tr>
                  <th bgcolor="#99ccff">Adı Soyadı</th>
				  <td><?=$veri[0]->adsoy?></td>
				</tr>
				<tr>
                  <th bgcolor="#99ccff">Mail Adresi</th>
				  <td><?=$veri[0]->email?></td>
				 </tr>
				 <tr>
				  <th bgcolor="#99ccff">Telefon</th>
				  <td><?=$veri[0]->tel?></td>
				  </tr>
				  <tr>
				  <th bgcolor="#99ccff">Mesaj</th>
				  <td><?=$veri[0]->mesaj?></td>
				  </tr>
				  <tr>
				  <th bgcolor="#99ccff">IP</th>
				  <td><?=$veri[0]->IP?></td>
				  </tr>
				  <tr>
				  <th bgcolor="#99ccff">Tarih:</th>
				  <td><?=$veri[0]->tarih?></td>
				  </tr>
				 
				  <tr>
				  <th bgcolor="#99ccff">Durum:</th>
				 <td> <select name="durum">
				  <option><?=$veri[0]->durum?></option>
				  <option>Cevaplandı</option>
				  <option>Cevaplanacak</option></select>
				  </tr>
				  </td>
				  
				 <tr>
				  <th bgcolor="#99ccff">Notunuz:</th>
				  <td>  
				  
				  <textarea name="adminnotu" rows="5" cols="60">  <?=$veri[0]->adminnotu?></textarea>
				  <button type="submit" class="btn btn-primary">Kaydet</button>
				  </form>
				  </td>
				  
				  </tr>
				</thead>
				
                
                
              </table>
            </div>
            <!-- /.box-body -->
          </div>
          <!-- /.box -->
        </div>

    </section>
    <!-- /.content -->
  </div>
  <!-- /.content-wrapper -->
  
